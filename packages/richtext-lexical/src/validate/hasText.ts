import type { SerializedEditorState, SerializedParagraphNode, SerializedTextNode } from 'lexical'

/**
 * This function checks if the editor state is empty (has any text). If the editor state has no nodes,
 * or only empty paragraph nodes (no TextNode with length > 0), it returns false.
 * Otherwise, it returns true.
 */
export function hasText(
  value: null | SerializedEditorState | undefined,
): value is SerializedEditorState {
  const hasChildren = !!value?.root?.children?.length
  if (!hasChildren) {
    return false
  }

  const hasOnlyEmptyParagraphs = value?.root?.children?.every((node) => {
    if (node?.type !== 'paragraph') {
      return false
    }

    const paragraphNode = node as SerializedParagraphNode

    return (paragraphNode?.children ?? []).every(
      (child) => child?.type === 'text' && !(child as SerializedTextNode)?.text?.length,
    )
  })

  if (hasOnlyEmptyParagraphs) {
    return false
  }

  return true
}
