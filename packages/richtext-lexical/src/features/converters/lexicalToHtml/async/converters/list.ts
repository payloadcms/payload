import { v4 as uuidv4 } from 'uuid'

import type { SerializedListItemNode, SerializedListNode } from '../../../../../nodeTypes.js'
import type { HTMLConvertersAsync } from '../types.js'

const ALLOWED_LIST_TAGS = new Set(['ol', 'ul'])
const ALLOWED_LIST_TYPES = new Set(['bullet', 'check', 'number'])

export const ListHTMLConverterAsync: HTMLConvertersAsync<
  SerializedListItemNode | SerializedListNode
> = {
  list: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    const tag = ALLOWED_LIST_TAGS.has(node.tag) ? node.tag : 'ul'
    const listType = ALLOWED_LIST_TYPES.has(node.listType) ? node.listType : 'bullet'

    return `<${tag}${providedStyleTag} class="list-${listType}">${children}</${tag}>`
  },
  listitem: async ({ node, nodesToHTML, parent, providedCSSString }) => {
    const hasSubLists = node.children.some((child) => child.type === 'list')

    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    if ('listType' in parent && parent?.listType === 'check') {
      const uuid = uuidv4()
      return `<li
          aria-checked="${node.checked ? 'true' : 'false'}"
          class="list-item-checkbox${node.checked ? ' list-item-checkbox-checked' : ' list-item-checkbox-unchecked'}${hasSubLists ? ' nestedListItem' : ''}"
          role="checkbox"
          style="list-style-type: none;${providedCSSString}"
          tabIndex="-1"
          value="${node.value}"
        >
          ${
            hasSubLists
              ? children
              : `<input${node.checked ? ' checked' : ''} id="${uuid}" readOnly="true" type="checkbox" />
            <label htmlFor="${uuid}">${children}</label>
            <br />`
          }
        </li>`
    } else {
      return `<li
          class="${hasSubLists ? 'nestedListItem' : ''}"
          style="${hasSubLists ? `list-style-type: none;${providedCSSString}` : providedCSSString}"
          value="${node.value}"
        >${children}</li>`
    }
  },
}
