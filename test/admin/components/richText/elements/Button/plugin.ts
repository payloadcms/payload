import type { Editor } from 'slate'

const withButton = (incomingEditor: Editor): Editor => {
  const editor = incomingEditor
  const { isVoid } = editor

  editor.isVoid = (element) => (element.type === 'button' ? true : isVoid(element))

  return editor
}

export default withButton
