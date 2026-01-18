export function isSerializedLexicalEditor(value) {
  return typeof value === 'object' && 'root' in value;
}
export function formatLexicalDocTitle(editorState, textContent) {
  for (const node of editorState) {
    if ('text' in node && node.text) {
      textContent += node.text;
    } else {
      if (!('children' in node)) {
        textContent += `[${node.type}]`;
      }
    }
    if ('children' in node && node.children) {
      textContent += formatLexicalDocTitle(node.children, textContent);
    }
  }
  return textContent;
}
//# sourceMappingURL=formatLexicalDocTitle.js.map