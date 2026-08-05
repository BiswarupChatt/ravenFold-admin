import { useMemo } from "react";
import { Box, FormHelperText } from "@mui/material";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  Autoformat,
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  Underline,
  Undo,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

import { normalizeEditorHtml } from "./editorHtml";
import "./RichTextEditor.css";

const EDITOR_PLUGINS = [
  Alignment,
  Autoformat,
  BlockQuote,
  Bold,
  Essentials,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  Underline,
  Undo,
];

const TOOLBAR_ITEMS = [
  "undo",
  "redo",
  "|",
  "heading",
  "|",
  "bold",
  "italic",
  "underline",
  "link",
  "|",
  "bulletedList",
  "numberedList",
  "blockQuote",
  "|",
  "alignment",
  "removeFormat",
];

const RichTextEditor = ({
  disabled = false,
  error = "",
  id,
  onBlur,
  onChange,
  placeholder = "",
  readOnly = false,
  value = "",
}) => {
  const editorConfig = useMemo(() => ({
    alignment: {
      options: ["left", "center", "right", "justify"],
    },
    heading: {
      options: [
        { class: "ck-heading_paragraph", model: "paragraph", title: "Paragraph" },
        { class: "ck-heading_heading1", model: "heading1", title: "Heading 1", view: "h1" },
        { class: "ck-heading_heading2", model: "heading2", title: "Heading 2", view: "h2" },
        { class: "ck-heading_heading3", model: "heading3", title: "Heading 3", view: "h3" },
      ],
    },
    licenseKey: "GPL",
    link: {
      addTargetToExternalLinks: true,
      defaultProtocol: "https://",
    },
    placeholder,
    plugins: EDITOR_PLUGINS,
    toolbar: {
      items: TOOLBAR_ITEMS,
      shouldNotGroupWhenFull: false,
    },
  }), [placeholder]);
  const isDisabled = disabled || readOnly;

  return (
    <Box
      className="richTextEditor richTextEditorCk"
      id={id}
      sx={{
        borderColor: error ? "error.main" : "divider",
      }}
    >
      <CKEditor
        config={editorConfig}
        data={normalizeEditorHtml(value)}
        disabled={isDisabled}
        editor={ClassicEditor}
        onBlur={(event, editor) => {
          onChange?.(normalizeEditorHtml(editor.getData()));
          onBlur?.(event);
        }}
        onChange={(_event, editor) => {
          onChange?.(normalizeEditorHtml(editor.getData()));
        }}
      />

      {error ? (
        <FormHelperText error sx={{ px: 1.5, pb: 1 }}>
          {error}
        </FormHelperText>
      ) : null}
    </Box>
  );
};

export default RichTextEditor;
