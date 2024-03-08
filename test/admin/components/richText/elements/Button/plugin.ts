import type { Editor } from 'slate'

export const withButton = (incomingEditor: Editor): Editor => {
  const editor = incomingEditor
  const { isVoid } = editor

  editor.isVoid = (element) => (element.type === 'button' ? true : isVoid(element))

  return editor
}
