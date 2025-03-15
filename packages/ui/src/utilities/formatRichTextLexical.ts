type SerializedLexicalEditor = {
  root: {
    children: Array<{ children?: Array<{ type: string }>; type: string }>
  }
}

export function isSerializedLexicalEditor(value: unknown): value is SerializedLexicalEditor {
  return typeof value === 'object' && 'root' in value
}

export function formatRichTextLexical(
  editorState: Array<{ children?: Array<{ type: string }>; type: string }>,
  textContent: string,
  i: number = 0,
): string {
  for (const node of editorState) {
    i++
    if ('text' in node && node.text) {
      textContent += node.text as string
    } else {
      if (!('children' in node)) {
        textContent += `[${node.type}]`
      }
    }
    if ('children' in node && node.children) {
      textContent += formatRichTextLexical(node.children as Array<{ type: string }>, textContent, i)
    }
  }
  return textContent
}
