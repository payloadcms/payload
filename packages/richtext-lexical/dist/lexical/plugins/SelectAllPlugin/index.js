import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, COMMAND_PRIORITY_LOW, SELECT_ALL_COMMAND } from 'lexical';
import { useEffect } from 'react';
/**
 * Allows to select inputs with `ctrl+a` or `cmd+a`.
 * Required because Lexical preventDefault the event.
 * see: https://github.com/payloadcms/payload/issues/6871
 */
export function SelectAllPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(SELECT_ALL_COMMAND, () => {
      const selection = $getSelection();
      if (selection) {
        return false;
      }
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement) {
        activeElement.select();
      }
      return true;
    }, COMMAND_PRIORITY_LOW);
  }, [editor]);
  return null;
}
//# sourceMappingURL=index.js.map