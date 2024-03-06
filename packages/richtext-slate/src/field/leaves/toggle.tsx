import { Editor } from 'slate'

import isLeafActive from './isActive.js'

const toggleLeaf = (editor, format) => {
  const isActive = isLeafActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export default toggleLeaf
