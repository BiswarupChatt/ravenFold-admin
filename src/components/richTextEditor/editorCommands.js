export const EDITOR_COMMANDS = {
  ALIGN_CENTER: "justifyCenter",
  ALIGN_JUSTIFY: "justifyFull",
  ALIGN_LEFT: "justifyLeft",
  ALIGN_RIGHT: "justifyRight",
  BOLD: "bold",
  FORMAT_BLOCK: "formatBlock",
  INSERT_ORDERED_LIST: "insertOrderedList",
  INSERT_UNORDERED_LIST: "insertUnorderedList",
  ITALIC: "italic",
  REDO: "redo",
  REMOVE_FORMAT: "removeFormat",
  UNDERLINE: "underline",
  UNDO: "undo",
  UNLINK: "unlink",
};

export const applyEditorCommand = (command, value = null) => {
  if (!document?.execCommand) {
    return false;
  }

  return document.execCommand(command, false, value);
};

export const applyFormatBlock = (tagName) => applyEditorCommand(EDITOR_COMMANDS.FORMAT_BLOCK, tagName);

export const applyLink = (url) => {
  const href = String(url || "").trim();

  if (!href) {
    return applyEditorCommand(EDITOR_COMMANDS.UNLINK);
  }

  return applyEditorCommand("createLink", href);
};

export const insertEditorHtml = (html) => applyEditorCommand("insertHTML", html);

export const queryEditorCommandState = (command) => {
  try {
    return Boolean(document.queryCommandState?.(command));
  } catch {
    return false;
  }
};

export const queryEditorCommandValue = (command) => {
  try {
    return document.queryCommandValue?.(command) || "";
  } catch {
    return "";
  }
};
