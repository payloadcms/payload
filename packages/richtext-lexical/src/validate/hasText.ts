import type {
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from 'lexical'

/**
 * This function checks if the editor state is empty (has any text). If the editor state has no nodes,
 * or only an empty paragraph node (no TextNode with length > 0), it returns false.
 * Otherwise, it returns true.
 */
export function hasText(
  value: null | SerializedEditorState<SerializedLexicalNode> | undefined,
): value is SerializedEditorState<SerializedLexicalNode> {
  const hasChildren = !!value?.root?.children?.length
  if (!hasChildren) {
    return false
  }

  let hasOnlyEmptyParagraph = false
  if (value?.root?.children?.length === 1) {
    if (value?.root?.children[0]?.type === 'paragraph') {
      const paragraphNode = value?.root?.children[0] as SerializedParagraphNode

      if (!paragraphNode?.children || paragraphNode?.children?.length === 0) {
        hasOnlyEmptyParagraph = true
      } else if (paragraphNode?.children?.length === 1) {
        const paragraphNodeChild = paragraphNode?.children[0]
        if (paragraphNodeChild?.type === 'text') {
          if (!(paragraphNodeChild as SerializedTextNode | undefined)?.['text']?.length) {
            hasOnlyEmptyParagraph = true
          }
        }
      }
    }
  }

  if (hasOnlyEmptyParagraph) {
    return false
  }

  return true
}
