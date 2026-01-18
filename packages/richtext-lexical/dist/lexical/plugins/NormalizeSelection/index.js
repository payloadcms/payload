import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, RootNode } from 'lexical';
import { useEffect } from 'react';
/**
 * By default, Lexical throws an error if the selection ends in deleted nodes.
 * This is very aggressive considering there are reasons why this can happen
 * outside of Payload's control (custom features or conflicting features, for example).
 * In the case of selections on nonexistent nodes, this plugin moves the selection to
 * the end of the editor and displays a warning instead of an error.
 */
export function NormalizeSelectionPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerNodeTransform(RootNode, root => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();
        if (!anchorNode.isAttached() || !focusNode.isAttached()) {
          root.selectEnd();
          // eslint-disable-next-line no-console
          console.warn('updateEditor: selection has been moved to the end of the editor because the previously selected nodes have been removed and ' + "selection wasn't moved to another node. Ensure selection changes after removing/replacing a selected node.");
        }
      }
      return false;
    });
  }, [editor]);
  return null;
}
//# sourceMappingURL=index.js.map