import type { LexicalEditor } from 'lexical'

import { $createParagraphNode, RootNode } from 'lexical'

/**
 * Appends an empty paragraph whenever an update leaves the root node without
 * children, so the editor state never becomes one Lexical refuses to load.
 *
 * Lexical lets an update remove the last root-level node - deleting the only
 * block, upload or table in the editor does exactly that - and serializes the
 * resulting `{ root: { children: [] } }` without complaint. It only checks for
 * emptiness when *loading* a state, where `editor.setEditorState` throws
 * "the editor state is empty". Left alone, autosave persists the value and the
 * field crashes on every subsequent open of the document.
 *
 * This mirrors the `$ensureEditorNotEmpty` recovery in Lexical's own
 * collaboration binding. Running as a root node transform, it is part of the
 * same update that emptied the root, so history and onChange see one change.
 */
export function registerEnsureRootNotEmpty(editor: LexicalEditor): () => void {
  return editor.registerNodeTransform(RootNode, (root) => {
    if (root.getChildrenSize() === 0) {
      root.append($createParagraphNode())
    }
  })
}
