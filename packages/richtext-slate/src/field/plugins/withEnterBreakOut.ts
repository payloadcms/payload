const enterBreakOutTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'link']

export const withEnterBreakOut = (editor) => {
  const newEditor = editor
  newEditor.shouldBreakOutOnEnter = (element) => enterBreakOutTypes.includes(String(element.type))
  return newEditor
}
