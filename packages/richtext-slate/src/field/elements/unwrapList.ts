import type { Path } from 'slate'

import { Editor, Element, Transforms } from 'slate'

import { areAllChildrenElements } from './areAllChildrenElements.js'
import { listTypes } from './listTypes.js'

export const unwrapList = (editor: Editor, atPath: Path): void => {
  // Remove type for any nodes that have text children -
  // this means that the node should remain
  Transforms.setNodes(
    editor,
    { type: undefined },
    {
      at: atPath,
      match: (node, path) => {
        const childrenAreAllElements = areAllChildrenElements(node)

        const matches =
          !Editor.isEditor(node) &&
          Element.isElement(node) &&
          !childrenAreAllElements &&
          node.type === 'li' &&
          path.length === atPath.length + 1

        return matches
      },
    },
  )

  // For nodes have all element children, unwrap it instead
  // because the li is a duplicative wrapper
  Transforms.unwrapNodes(editor, {
    at: atPath,
    match: (node, path) => {
      const childrenAreAllElements = areAllChildrenElements(node)

      const matches =
        !Editor.isEditor(node) &&
        Element.isElement(node) &&
        childrenAreAllElements &&
        node.type === 'li' &&
        path.length === atPath.length + 1

      return matches
    },
  })

  // Finally, unwrap the UL itself
  Transforms.unwrapNodes(editor, {
    match: (n) => Element.isElement(n) && listTypes.includes(n.type),
    mode: 'lowest',
  })
}
