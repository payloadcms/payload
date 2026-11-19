import type { SerializedEditorState, SerializedLexicalNode, SerializedTextNode } from 'lexical'

function isBlockEmpty(node: SerializedLexicalNode): boolean {
  if (node?.type !== 'paragraph' && node?.type !== 'heading') {
    return false
  }

  const children = (node as { children?: SerializedLexicalNode[] })?.children
  if (!children || children.length === 0) {
    return true
  }

  return children.every((child) => {
    if (child?.type === 'linebreak') {
      return true
    }
    if (child?.type === 'text') {
      return !(child as SerializedTextNode)?.text?.length
    }
    return false
  })
}

/**
 * This function checks if the editor state is empty (has any text). If the editor state has no nodes,
 * or only empty paragraph or heading nodes (no TextNode with length > 0, or only linebreaks),
 * it returns false. Otherwise, it returns true.
 */
export function hasText(
  value: null | SerializedEditorState | undefined,
): value is SerializedEditorState {
  const children = value?.root?.children
  if (!children?.length) {
    return false
  }

  const hasOnlyEmptyBlocks = children.every(isBlockEmpty)
  if (hasOnlyEmptyBlocks) {
    return false
  }

  return true
}
