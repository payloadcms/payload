import type { SerializedEditorState } from 'lexical'

/**
 * Whether a serialized editor state has a root node with no children.
 *
 * Lexical can produce this state - removing the last root-level node (the only
 * block, upload or table in the editor, for example) leaves root without
 * children - but it refuses to load it: `editor.setEditorState` throws
 * "the editor state is empty. Ensure the editor state's root node never becomes
 * empty." for it. A stored value of this shape would therefore crash the field
 * every time the document is opened.
 */
export function hasEmptyRoot(value: null | SerializedEditorState | undefined): boolean {
  return Array.isArray(value?.root?.children) && value.root.children.length === 0
}
