import React from 'react';
import { $getRoot, LexicalEditor } from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';
import PlaygroundNodes from '../../../../../../forms/field-types/LexicalRichText/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from '../../../../../../forms/field-types/LexicalRichText/themes/PlaygroundEditorTheme';

const RichTextCell = ({ data }) => {
  const initialConfig = {
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    theme: PlaygroundEditorTheme,
  };

  const editor: LexicalEditor = createHeadlessEditor(initialConfig);
  editor.setEditorState(editor.parseEditorState(data));

  const textContent = editor.getEditorState().read(() => {
    return $getRoot().getTextContent();
  });

  const textToShow = textContent?.length > 100 ? `${textContent.slice(0, 100)}\u2026` : textContent;


  return (
    <span>{textToShow}</span>
  );
};

export default RichTextCell;
