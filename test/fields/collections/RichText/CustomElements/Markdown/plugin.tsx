import { elementIdentifier } from '.';

export const withMarkdown = (editor) => {
  const { isVoid } = editor;

  editor.isVoid = (element) => (element.type === elementIdentifier ? true : isVoid(element));

  return editor;
};
