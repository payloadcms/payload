import { Editor } from 'slate'

export const isLeafActive = (editor, format) => {
  const leaves = Editor.marks(editor)
  return leaves ? leaves[format] === true : false
}
