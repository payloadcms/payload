'use client';

import { $getRoot } from 'lexical';
export function getTopLevelNodeKeys(editor) {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys());
}
//# sourceMappingURL=getTopLevelNodeKeys.js.map