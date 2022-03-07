import { Editor, Transforms, Range, Element } from 'slate';
import isElementActive from '../isActive';

export const unwrapLink = (editor: Editor): void => {
  Transforms.unwrapNodes(editor, { match: (n) => Element.isElement(n) && n.type === 'link' });
};

export const wrapLink = (editor: Editor, url?: string, newTab?: boolean): void => {
  const { selection, blurSelection } = editor;

  if (blurSelection) {
    Transforms.select(editor, blurSelection);
  }

  if (isElementActive(editor, 'link')) {
    unwrapLink(editor);
  } else {
    const selectionToUse = selection || blurSelection;

    const isCollapsed = selectionToUse && Range.isCollapsed(selectionToUse);

    const link = {
      type: 'link',
      url,
      newTab,
      children: isCollapsed ? [{ text: url }] : [],
    };

    if (isCollapsed) {
      Transforms.insertNodes(editor, link);
    } else {
      Transforms.wrapNodes(editor, link, { split: true });
      Transforms.collapse(editor, { edge: 'end' });
    }
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
