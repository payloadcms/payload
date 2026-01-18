import { Editor, Element } from 'slate';
/**
 * Returns true, if the provided node is a Block Element.
 * Note: Using Editor.isBlock() is not sufficient, as since slate 0.90 it returns `true` for Text nodes and the editor as well.
 *
 * Related Issue: https://github.com/ianstormtaylor/slate/issues/5287
 */
export declare const isBlockElement: (editor: Editor, node: any) => node is Element;
//# sourceMappingURL=isBlockElement.d.ts.map