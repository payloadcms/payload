import type { HTMLConverter } from '../types.js'

import { convertLexicalNodesToHTML } from '../serializeLexical.js'

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

    return `<${node?.tag} class="${node?.listType}">${childrenText}</${node?.tag}>`
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

    if ('listType' in parent && parent?.listType === 'check') {
      return `<li aria-checked=${node.checked ? 'true' : 'false'} class="${
        'list-item-checkbox' + node.checked
          ? 'list-item-checkbox-checked'
          : 'list-item-checkbox-unchecked'
      }"
          role="checkbox"
          tabIndex=${-1}
          value=${node?.value}
      >
          ${childrenText}
          </li>`
    } else {
      return `<li value=${node?.value}>${childrenText}</li>`
    }
  },
  nodeTypes: ['listitem'],
}
