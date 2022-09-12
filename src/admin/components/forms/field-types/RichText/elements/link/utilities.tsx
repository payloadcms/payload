import { Editor, Transforms, Range, Element } from 'slate';

export const unwrapLink = (editor: Editor): void => {
  Transforms.unwrapNodes(editor, { match: (n) => Element.isElement(n) && n.type === 'link' });
};

export const wrapLink = (editor: Editor): void => {
  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);

  const link = {
    type: 'link',
    url: undefined,
    newTab: false,
    children: isCollapsed ? [{ text: '' }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
};

export const withLinks = (incomingEditor: Editor): Editor => {
  const editor = incomingEditor;
  const { isInline } = editor;

  editor.isInline = (element) => {
    if (element.type === 'link') {
      return true;
    }

    return isInline(element);
  };

  return editor;
};
