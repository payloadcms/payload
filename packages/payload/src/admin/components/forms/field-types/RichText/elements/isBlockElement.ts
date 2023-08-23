import { Editor, Element } from 'slate';

/**
 * Returns true, if the provided node is an Element (optionally of a specific type)
 */
const isElement = (node: any, specificType?: string | string[]): node is Element => {
  if (Editor.isEditor(node) || !Element.isElement(node)) {
    return false;
  }
  if (undefined === specificType) {
    return true;
  }
  if (typeof specificType === 'string') {
    return node.type === specificType;
  }
  return specificType.includes(node.type);
};

/**
 * Returns true, if the provided node is a Block Element.
 * Note: Using Editor.isBlock() is not sufficient, as since slate 0.90 it returns `true` for Text nodes and the editor as well.
 *
 * Related Issue: https://github.com/ianstormtaylor/slate/issues/5287
 */

export const isBlockElement = (editor: Editor, node: any): node is Element => Editor.isBlock(editor, node as any) && isElement(node);
