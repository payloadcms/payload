'use client'
import type { LexicalEditor } from 'lexical'

import { $getRoot } from 'lexical'

export function getTopLevelNodeKeys(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys())
}
