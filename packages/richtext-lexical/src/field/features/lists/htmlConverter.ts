import type { SerializedListItemNode, SerializedListNode } from '@lexical/list'

import { ListItemNode, ListNode } from '@lexical/list'

import type { HTMLConverter } from '../converters/html/converter/types'

import { convertLexicalNodesToHTML } from '../converters/html/converter'

export const ListHTMLConverter: HTMLConverter<SerializedListNode> = {
  converter: async ({ converters, node }) => {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parentNodeType: ListNode.getType(),
    })

    return `<${node?.tag} class="${node?.listType}" >${childrenText}</${node?.tag}>`
  },
  nodeTypes: [ListNode.getType()],
}

export const ListItemHTMLConverter: HTMLConverter<SerializedListItemNode> = {
  converter: async ({ converters, node }) => {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parentNodeType: ListItemNode.getType(),
    })

    if (node?.checked != null) {
      return `<li aria-checked=${node.checked ? 'true' : 'false'} class="${
        'list-item-checkbox' + node.checked
          ? 'list-item-checkbox-checked'
          : 'list-item-checkbox-unchecked'
      }"
          role="checkbox"
          tabIndex=${-1}
          value=${node?.value}
      >
          {serializedChildren}
          </li>`
    } else {
      return `<li value=${node?.value}>${childrenText}</li>`
    }
  },
  nodeTypes: [ListItemNode.getType()],
}
