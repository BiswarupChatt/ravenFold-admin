const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "DIV",
  "EM",
  "H1",
  "H2",
  "H3",
  "I",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);

const INLINE_FORMAT_TAGS = new Set(["A", "B", "EM", "I", "SPAN", "STRONG", "U"]);
const ALIGNMENT_CLASSES = new Set(["align-left", "align-center", "align-right", "align-justify"]);
const BLOCK_TAGS = new Set(["BLOCKQUOTE", "DIV", "H1", "H2", "H3", "LI", "P"]);
const LIST_TAGS = new Set(["OL", "UL"]);
let pasteClassStyles = new Map();

const parseInlineStyles = (styleValue = "") => (
  String(styleValue || "")
    .split(";")
    .map((rule) => rule.split(":"))
    .filter((parts) => parts.length >= 2)
    .reduce((styles, [property, ...valueParts]) => ({
      ...styles,
      [property.trim().toLowerCase()]: valueParts.join(":").trim().toLowerCase(),
    }), {})
);

const getStyleValue = (node, property) => (
  getMergedStyles(node)[property] || ""
);

const getMergedStyles = (node) => {
  const classStyles = String(node.getAttribute?.("class") || "")
    .split(/\s+/)
    .filter(Boolean)
    .reduce((styles, className) => ({
      ...styles,
      ...(pasteClassStyles.get(className) || {}),
    }), {});

  return {
    ...classStyles,
    ...parseInlineStyles(node.getAttribute?.("style")),
  };
};

const createPasteClassStyleMap = (documentRef) => {
  const styleText = Array.from(documentRef.querySelectorAll("style"))
    .map((styleNode) => styleNode.textContent || "")
    .join("\n");
  const classStyles = new Map();
  const classRulePattern = /(?:^|[\s,])(?:[a-z]+)?\.([_a-zA-Z][\w-]*)\s*\{([^}]+)\}/g;
  let match = classRulePattern.exec(styleText);

  while (match) {
    classStyles.set(match[1], {
      ...(classStyles.get(match[1]) || {}),
      ...parseInlineStyles(match[2]),
    });
    match = classRulePattern.exec(styleText);
  }

  return classStyles;
};

const containsBlockContent = (node) => (
  Array.from(node.querySelectorAll?.("blockquote, div, h1, h2, h3, li, ol, p, ul") || []).length > 0
);

const safeUrl = (url = "") => {
  const href = String(url || "").trim();

  if (!href) {
    return "";
  }

  if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) {
    return href;
  }

  return "";
};

const normalizeClasses = (className = "") => (
  String(className)
    .split(/\s+/)
    .filter((item) => ALIGNMENT_CLASSES.has(item))
    .join(" ")
);

const getAlignmentClass = (node) => {
  const styles = getMergedStyles(node);
  const alignValue = String(node.getAttribute?.("align") || styles["text-align"] || "").trim().toLowerCase();

  if (["left", "center", "right", "justify"].includes(alignValue)) {
    return `align-${alignValue}`;
  }

  return "";
};

const getHeadingTagFromNode = (node) => {
  const tagName = node.tagName?.toUpperCase?.() || "";
  const className = String(node.getAttribute?.("class") || "").toLowerCase().replace(/\s+/g, "");
  const styles = getMergedStyles(node);
  const outlineLevel = Number(styles["mso-outline-level"]);
  const fontSize = Number(String(styles["font-size"] || "").replace(/[^\d.]/g, ""));
  const fontWeight = styles["font-weight"];

  if (["H1", "H2", "H3"].includes(tagName)) {
    return tagName.toLowerCase();
  }

  if (outlineLevel >= 1 && outlineLevel <= 3) {
    return `h${outlineLevel}`;
  }

  if (className.includes("heading1") || className.includes("msoheading1")) {
    return "h1";
  }

  if (className.includes("heading2") || className.includes("msoheading2")) {
    return "h2";
  }

  if (className.includes("heading3") || className.includes("msoheading3")) {
    return "h3";
  }

  if ((fontWeight === "bold" || Number(fontWeight) >= 600) && fontSize >= 20) {
    return "h1";
  }

  if ((fontWeight === "bold" || Number(fontWeight) >= 600) && fontSize >= 16) {
    return "h2";
  }

  if ((fontWeight === "bold" || Number(fontWeight) >= 600) && fontSize >= 14) {
    return "h3";
  }

  return "";
};

const hasBoldStyle = (node) => {
  const fontWeight = getStyleValue(node, "font-weight");

  if (fontWeight && (["normal", "400"].includes(fontWeight) || Number(fontWeight) < 600)) {
    return false;
  }

  return fontWeight === "bold"
    || Number(fontWeight) >= 600
    || (["B", "STRONG"].includes(node.tagName) && !fontWeight && !containsBlockContent(node));
};

const hasItalicStyle = (node) => {
  const fontStyle = getStyleValue(node, "font-style");

  if (fontStyle === "normal") {
    return false;
  }

  return fontStyle === "italic" || (["I", "EM"].includes(node.tagName) && !fontStyle && !containsBlockContent(node));
};

const hasUnderlineStyle = (node) => {
  const textDecoration = getStyleValue(node, "text-decoration");

  if (textDecoration === "none") {
    return false;
  }

  return String(textDecoration || "").includes("underline")
    || (node.tagName === "U" && !textDecoration && !containsBlockContent(node));
};

const appendSanitizedChildren = (sourceNode, outputNode, documentRef) => {
  Array.from(sourceNode.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, documentRef);

    if (sanitizedChild.textContent || sanitizedChild.childNodes?.length || sanitizedChild.nodeName === "BR") {
      outputNode.appendChild(sanitizedChild);
    }
  });
};

const wrapInlineFormatting = (node, output, documentRef) => {
  let formattedOutput = output;

  if (hasUnderlineStyle(node) && output.tagName !== "U") {
    const wrapper = documentRef.createElement("u");

    wrapper.appendChild(formattedOutput);
    formattedOutput = wrapper;
  }

  if (hasItalicStyle(node) && output.tagName !== "EM" && output.tagName !== "I") {
    const wrapper = documentRef.createElement("em");

    wrapper.appendChild(formattedOutput);
    formattedOutput = wrapper;
  }

  if (hasBoldStyle(node) && output.tagName !== "STRONG" && output.tagName !== "B") {
    const wrapper = documentRef.createElement("strong");

    wrapper.appendChild(formattedOutput);
    formattedOutput = wrapper;
  }

  return formattedOutput;
};

const applyBlockInlineFormatting = (node, output, documentRef) => {
  if (!hasBoldStyle(node) && !hasItalicStyle(node) && !hasUnderlineStyle(node)) {
    return;
  }

  const fragment = documentRef.createDocumentFragment();

  while (output.firstChild) {
    fragment.appendChild(output.firstChild);
  }

  const wrapperSeed = documentRef.createElement("span");

  wrapperSeed.appendChild(fragment);
  output.appendChild(wrapInlineFormatting(node, wrapperSeed, documentRef));
};

const getWordListInfo = (node) => {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const styles = getMergedStyles(node);
  const text = (node.textContent || "").trim();
  const hasWordListStyle = Boolean(styles["mso-list"]);
  const orderedMatch = text.match(/^(\(?\d+[\).]|[a-z][\).]|[ivxlcdm]+[\).])\s*/i);
  const unorderedMatch = text.match(/^([•·▪●○■□▪▫◦‣⁃*-])\s*/i);

  if (!hasWordListStyle && !orderedMatch && !unorderedMatch) {
    return null;
  }

  return {
    markerPattern: orderedMatch || unorderedMatch,
    type: orderedMatch ? "ol" : "ul",
  };
};

const removeLeadingListMarker = (node, markerPattern) => {
  if (!markerPattern) {
    return;
  }

  const markerText = markerPattern[0];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const firstTextNode = walker.nextNode();

  if (!firstTextNode) {
    return;
  }

  firstTextNode.textContent = firstTextNode.textContent.replace(markerText, "");
};

const unwrapSingleBlockFromListItem = (listItem, outputDocument) => {
  const elementChildren = Array.from(listItem.children);

  if (elementChildren.length !== 1 || !["P", "DIV"].includes(elementChildren[0].tagName)) {
    return;
  }

  const onlyChild = elementChildren[0];
  const className = onlyChild.getAttribute("class");
  const fragment = outputDocument.createDocumentFragment();

  while (onlyChild.firstChild) {
    fragment.appendChild(onlyChild.firstChild);
  }

  listItem.textContent = "";
  listItem.appendChild(fragment);

  if (className) {
    listItem.setAttribute("class", className);
  }
};

const unwrapFullBlockFormatting = (block, tagNames = ["B", "STRONG"]) => {
  const elementChildren = Array.from(block.children);

  if (elementChildren.length !== 1 || !tagNames.includes(elementChildren[0].tagName)) {
    return;
  }

  const wrapper = elementChildren[0];
  const fragment = block.ownerDocument.createDocumentFragment();

  while (wrapper.firstChild) {
    fragment.appendChild(wrapper.firstChild);
  }

  block.textContent = "";
  block.appendChild(fragment);
};

const isFullBlockFormatted = (block, tagNames = ["B", "STRONG"]) => {
  const elementChildren = Array.from(block.children);

  return elementChildren.length === 1 && tagNames.includes(elementChildren[0].tagName);
};

const isPolicyHeadingText = (text = "") => {
  const normalizedText = String(text || "").trim();

  if (!normalizedText || normalizedText.length > 96) {
    return false;
  }

  if (/^\d+[\).]\s+\S/.test(normalizedText)) {
    return true;
  }

  if (/^(privacy|terms|shipping|delivery|order|return|refund|cancellation|warranty|cookie|grievance|contact|scope|eligibility|processing|coverage)\b/i.test(normalizedText)) {
    return true;
  }

  return false;
};

const recoverHeadingsAndNoisyBold = (container, outputDocument) => {
  Array.from(container.querySelectorAll("p, div")).forEach((block) => {
    const text = (block.textContent || "").replace(/\s+/g, " ").trim();

    if (!text) {
      return;
    }

    if (isFullBlockFormatted(block) && isPolicyHeadingText(text)) {
      const heading = outputDocument.createElement(/^\d+[\).]/.test(text) ? "h2" : "h3");
      const className = block.getAttribute("class");

      if (className) {
        heading.setAttribute("class", className);
      }

      heading.textContent = text;
      block.replaceWith(heading);
      return;
    }

    if (text.length > 96 && isFullBlockFormatted(block)) {
      unwrapFullBlockFormatting(block);
    }
  });
};

const isLooseListParagraph = (node) => {
  if (!node || !["P", "DIV"].includes(node.tagName)) {
    return false;
  }

  const text = (node.textContent || "").replace(/\s+/g, " ").trim();

  if (!text || text.length > 140 || isPolicyHeadingText(text)) {
    return false;
  }

  return /[;,]$/.test(text)
    || /\bor$/.test(text)
    || /^[A-Z][a-z]+(?:[- ][a-z]+){0,5}$/.test(text);
};

const recoverLooseLists = (container, outputDocument) => {
  const nodes = Array.from(container.childNodes);
  const nextNodes = [];
  let index = 0;

  while (index < nodes.length) {
    const current = nodes[index];
    const previous = nextNodes[nextNodes.length - 1];
    const previousText = (previous?.textContent || "").trim();
    const sequence = [];
    let cursor = index;

    while (cursor < nodes.length && isLooseListParagraph(nodes[cursor])) {
      sequence.push(nodes[cursor]);
      cursor += 1;
    }

    if (sequence.length >= 2 && /:$/.test(previousText)) {
      const list = outputDocument.createElement("ul");

      sequence.forEach((paragraph) => {
        const listItem = outputDocument.createElement("li");
        const className = paragraph.getAttribute("class");

        if (className) {
          listItem.setAttribute("class", className);
        }

        unwrapFullBlockFormatting(paragraph);

        while (paragraph.firstChild) {
          listItem.appendChild(paragraph.firstChild);
        }

        list.appendChild(listItem);
      });

      nextNodes.push(list);
      index = cursor;
      continue;
    }

    nextNodes.push(current);
    index += 1;
  }

  container.textContent = "";
  nextNodes.forEach((node) => container.appendChild(node));
};

const convertMarkedParagraphsToLists = (container, outputDocument) => {
  const nextContainer = outputDocument.createElement("div");
  const activeListState = { list: null };

  Array.from(container.childNodes).forEach((node) => {
    appendPastedNode(node, nextContainer, outputDocument, activeListState);
  });

  container.textContent = "";

  Array.from(nextContainer.childNodes).forEach((node) => {
    container.appendChild(node);
  });
};

const sanitizeNode = (node, documentRef) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return documentRef.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return documentRef.createTextNode("");
  }

  const tagName = node.tagName.toUpperCase();
  const headingTag = getHeadingTagFromNode(node);
  const outputTagName = headingTag
    || (ALLOWED_TAGS.has(tagName)
      ? tagName.toLowerCase()
      : INLINE_FORMAT_TAGS.has(tagName)
        ? "span"
        : "p");
  const output = documentRef.createElement(outputTagName);

  if (outputTagName === "a") {
    const href = safeUrl(node.getAttribute("href"));

    if (href) {
      output.setAttribute("href", href);

      if (/^https?:\/\//i.test(href)) {
        output.setAttribute("target", "_blank");
        output.setAttribute("rel", "noopener noreferrer");
      }
    }
  }

  const className = [
    normalizeClasses(node.getAttribute("class")),
    getAlignmentClass(node),
  ].filter(Boolean).join(" ");

  if (className) {
    output.setAttribute("class", className);
  }

  appendSanitizedChildren(node, output, documentRef);

  if (BLOCK_TAGS.has(output.tagName) || LIST_TAGS.has(output.tagName)) {
    if (!["H1", "H2", "H3"].includes(output.tagName)) {
      applyBlockInlineFormatting(node, output, documentRef);
    }

    return output;
  }

  return wrapInlineFormatting(node, output, documentRef);
};

const appendPastedNode = (node, container, outputDocument, activeListState) => {
  const listInfo = getWordListInfo(node);

  if (!listInfo) {
    activeListState.list = null;
    container.appendChild(sanitizeNode(node, outputDocument));
    return;
  }

  if (!activeListState.list || activeListState.list.tagName.toLowerCase() !== listInfo.type) {
    activeListState.list = outputDocument.createElement(listInfo.type);
    container.appendChild(activeListState.list);
  }

  const clonedNode = node.cloneNode(true);

  removeLeadingListMarker(clonedNode, listInfo.markerPattern);

  const listItem = outputDocument.createElement("li");

  Array.from(clonedNode.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, outputDocument);

    if (sanitizedChild.textContent || sanitizedChild.childNodes?.length || sanitizedChild.nodeName === "BR") {
      listItem.appendChild(sanitizedChild);
    }
  });

  const className = getAlignmentClass(node);

  if (className) {
    listItem.setAttribute("class", className);
  }

  unwrapSingleBlockFromListItem(listItem, outputDocument);
  activeListState.list.appendChild(listItem);
};

export const cleanPastedHtml = (html = "") => {
  const parser = new DOMParser();
  const sourceDocument = parser.parseFromString(String(html || ""), "text/html");
  const outputDocument = document.implementation.createHTMLDocument("");
  const container = outputDocument.createElement("div");
  const activeListState = { list: null };

  pasteClassStyles = createPasteClassStyleMap(sourceDocument);
  Array.from(sourceDocument.body.childNodes).forEach((node) => {
    appendPastedNode(node, container, outputDocument, activeListState);
  });
  convertMarkedParagraphsToLists(container, outputDocument);
  recoverHeadingsAndNoisyBold(container, outputDocument);
  recoverLooseLists(container, outputDocument);
  pasteClassStyles = new Map();

  return normalizeEditorHtml(container.innerHTML);
};

const appendParagraph = (container, outputDocument, text = "") => {
  const paragraph = outputDocument.createElement("p");

  paragraph.textContent = text;
  container.appendChild(paragraph);
};

const appendInlineMarkdown = (parent, outputDocument, text = "") => {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = String(text || "").split(pattern).filter((part) => part !== "");

  parts.forEach((part) => {
    if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
      const strong = outputDocument.createElement("strong");

      strong.textContent = part.slice(2, -2);
      parent.appendChild(strong);
      return;
    }

    if (/^\*[^*]+\*$/.test(part) || /^_[^_]+_$/.test(part)) {
      const em = outputDocument.createElement("em");

      em.textContent = part.slice(1, -1);
      parent.appendChild(em);
      return;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

    if (linkMatch) {
      const href = safeUrl(linkMatch[2]);

      if (href) {
        const link = outputDocument.createElement("a");

        link.href = href;
        link.textContent = linkMatch[1];
        parent.appendChild(link);
        return;
      }
    }

    parent.appendChild(outputDocument.createTextNode(part.replace(/^`|`$/g, "")));
  });
};

export const cleanPastedPlainText = (text = "") => {
  const outputDocument = document.implementation.createHTMLDocument("");
  const container = outputDocument.createElement("div");
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const markdownHeading = line.match(/^(#{1,3})\s+(.+)$/);

    if (markdownHeading) {
      const heading = outputDocument.createElement(`h${markdownHeading[1].length}`);

      appendInlineMarkdown(heading, outputDocument, markdownHeading[2]);
      container.appendChild(heading);
      index += 1;
      continue;
    }

    if (isPolicyHeadingText(line)) {
      const heading = outputDocument.createElement(/^\d+[\).]/.test(line) ? "h2" : "h3");

      appendInlineMarkdown(heading, outputDocument, line);
      container.appendChild(heading);
      index += 1;
      continue;
    }

    const unorderedMatch = line.match(/^[-*•]\s+(.+)$/);
    const orderedMatch = line.match(/^\d+[\).]\s+(.+)$/);

    if (unorderedMatch || orderedMatch) {
      const list = outputDocument.createElement(unorderedMatch ? "ul" : "ol");
      const listPattern = unorderedMatch ? /^[-*•]\s+(.+)$/ : /^\d+[\).]\s+(.+)$/;

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(listPattern);

        if (!itemMatch) {
          break;
        }

        const listItem = outputDocument.createElement("li");

        appendInlineMarkdown(listItem, outputDocument, itemMatch[1]);
        list.appendChild(listItem);
        index += 1;
      }

      container.appendChild(list);
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+/.test(lines[index].trim())) {
      const nextLine = lines[index].trim();

      if (isPolicyHeadingText(nextLine) || /^[-*•]\s+/.test(nextLine) || /^\d+[\).]\s+/.test(nextLine)) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    const paragraph = outputDocument.createElement("p");

    appendInlineMarkdown(paragraph, outputDocument, paragraphLines.join(" "));
    container.appendChild(paragraph);
  }

  if (!container.innerHTML) {
    appendParagraph(container, outputDocument, text);
  }

  return normalizeEditorHtml(container.innerHTML);
};

export const normalizeEditorHtml = (html = "") => {
  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(String(html || ""), "text/html");
  const outputDocument = document.implementation.createHTMLDocument("");
  const container = outputDocument.createElement("div");

  Array.from(parsedDocument.body.childNodes).forEach((node) => {
    container.appendChild(sanitizeNode(node, outputDocument));
  });

  return container.innerHTML
    .replace(/<p><br><\/p>/gi, "")
    .replace(/\sdata-[^=]+="[^"]*"/gi, "")
    .trim();
};

export const extractPlainText = (html = "") => {
  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(String(html || ""), "text/html");

  return (parsedDocument.body.textContent || "").replace(/\s+/g, " ").trim();
};

export const isEditorHtmlEmpty = (html = "") => !extractPlainText(html);
