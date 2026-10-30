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

    if (!paragraphNode?.children || paragraphNode?.children?.length === 0) {
      return true
    }

    if (paragraphNode?.children?.length === 1) {
      const paragraphNodeChild = paragraphNode?.children[0]
      if (paragraphNodeChild?.type === 'text') {
        return !(paragraphNodeChild as SerializedTextNode | undefined)?.['text']?.length
      }
    }

    return false
  })

  if (hasOnlyEmptyParagraphs) {
    return false
  }

  return true
}
