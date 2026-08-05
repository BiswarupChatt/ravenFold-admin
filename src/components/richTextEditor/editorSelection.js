export const saveEditorSelection = (editorElement) => {
  const selection = window.getSelection?.();

  if (!selection || selection.rangeCount === 0 || !editorElement) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!editorElement.contains(range.commonAncestorContainer)) {
    return null;
  }

  return range.cloneRange();
};

export const restoreEditorSelection = (range) => {
  if (!range) {
    return;
  }

  const selection = window.getSelection?.();

  if (!selection) {
    return;
  }

  selection.removeAllRanges();
  selection.addRange(range);
};
