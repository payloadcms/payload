import type { HTMLConverter } from '../types.js'

import { convertLexicalNodesToHTML } from '../serializeLexical.js'

const ALLOWED_LIST_TAGS = new Set(['ol', 'ul'])
const ALLOWED_LIST_TYPES = new Set(['bullet', 'check', 'number'])

export const ListHTMLConverter: HTMLConverter<any> = {
  converter: async ({ converters, node, parent, submissionData }) => {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
      submissionData,
    })

    const tag = ALLOWED_LIST_TAGS.has(node?.tag) ? node.tag : 'ul'
    const listType = ALLOWED_LIST_TYPES.has(node?.listType) ? node.listType : 'bullet'

    return `<${tag} class="${listType}">${childrenText}</${tag}>`
  },
  nodeTypes: ['list'],
}

export const ListItemHTMLConverter: HTMLConverter<any> = {
  converter: async ({ converters, node, parent }) => {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
    })

    const safeValue = Number.isFinite(Number(node?.value)) ? Number(node.value) : 1

    if ('listType' in parent && parent?.listType === 'check') {
      return `<li aria-checked="${node.checked ? 'true' : 'false'}" class="${
        node.checked
          ? 'list-item-checkbox list-item-checkbox-checked'
          : 'list-item-checkbox list-item-checkbox-unchecked'
      }"
          role="checkbox"
          tabIndex="-1"
          value="${safeValue}"
      >
          ${childrenText}
          </li>`
    } else {
      return `<li value="${safeValue}">${childrenText}</li>`
    }
  },
  nodeTypes: ['listitem'],
}
