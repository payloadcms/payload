type SerializedLexicalEditor = {
  root: {
    children: Array<{ children?: Array<{ type: string }>; type: string }>
  }
}

export function isSerializedLexicalEditor(value: unknown): value is SerializedLexicalEditor {
  return typeof value === 'object' && 'root' in value
}

export function formatLexicalDocTitle(
  editorState: Array<{ children?: Array<{ type: string }>; type: string }>,
  textContent: string,
): string {
  for (const node of editorState) {
    if ('text' in node && node.text) {
      textContent += node.text as string
    } else {
      if (!('children' in node)) {
        textContent += `[${node.type}]`
      }
    }
    if ('children' in node && node.children) {
      textContent += formatLexicalDocTitle(node.children as Array<{ type: string }>, textContent)
    }
  }
  return textContent
}
