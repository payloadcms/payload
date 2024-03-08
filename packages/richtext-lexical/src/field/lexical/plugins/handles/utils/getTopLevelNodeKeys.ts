import type { LexicalEditor } from 'lexical'

import lexicalImport from 'lexical'
const { $getRoot } = lexicalImport

export function getTopLevelNodeKeys(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys())
}
