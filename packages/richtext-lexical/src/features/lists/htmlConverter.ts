import { ListItemNode, ListNode } from '@lexical/list'
import { v4 as uuidv4 } from 'uuid'

import type { HTMLConverter } from '../converters/lexicalToHtml_deprecated/converter/types.js'
import type { SerializedListItemNode, SerializedListNode } from './plugin/index.js'

import { convertLexicalNodesToHTML } from '../converters/lexicalToHtml_deprecated/converter/index.js'

export const ListHTMLConverter: HTMLConverter<SerializedListNode> = {
  converter: async ({
    converters,
    currentDepth,
    depth,
    draft,
    node,
    overrideAccess,
    parent,
    req,
    showHiddenFields,
  }) => {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      currentDepth,
      depth,
      draft,
      lexicalNodes: node.children,
      overrideAccess,
      parent: {
        ...node,
        parent,
      },
      req,
      showHiddenFields,
    })

    return `<${node?.tag} class="list-${node?.listType}">${childrenText}</${node?.tag}>`
  },
  nodeTypes: [ListNode.getType()],
}

export const ListItemHTMLConverter: HTMLConverter<SerializedListItemNode> = {
  converter: async ({
    converters,
    currentDepth,
    depth,
    draft,
    node,
    overrideAccess,
    parent,
    req,
    showHiddenFields,
  }) => {
    const hasSubLists = node.children.some((child) => child.type === 'list')

    const childrenText = await convertLexicalNodesToHTML({
      converters,
      currentDepth,
      depth,
      draft,
      lexicalNodes: node.children,
      overrideAccess,
      parent: {
        ...node,
        parent,
      },
      req,
      showHiddenFields,
    })

    if ('listType' in parent && parent?.listType === 'check') {
      const uuid = uuidv4()

      return `<li aria-checked=${node.checked ? 'true' : 'false'} class="${
        'list-item-checkbox' +
        (node.checked ? ' list-item-checkbox-checked' : ' list-item-checkbox-unchecked') +
        (hasSubLists ? ' nestedListItem' : '')
      }"
          role="checkbox"
          tabIndex=${-1}
          value=${node?.value}
      >
      ${
        hasSubLists
          ? childrenText
          : `
        <input type="checkbox" id="${uuid}"${node.checked ? ' checked' : ''}>
        <label for="${uuid}">${childrenText}</label><br>
      `
      }


          </li>`
    } else {
      return `<li ${hasSubLists ? `class="nestedListItem" ` : ''}value=${node?.value}>${childrenText}</li>`
    }
  },
  nodeTypes: [ListItemNode.getType()],
}
