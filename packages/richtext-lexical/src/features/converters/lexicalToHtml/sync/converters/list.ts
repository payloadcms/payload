import { v4 as uuidv4 } from 'uuid'

import type { SerializedListItemNode, SerializedListNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const ListHTMLConverter: HTMLConverters<SerializedListItemNode | SerializedListNode> = {
  list: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    return `<${node.tag}${providedStyleTag} class="list-${node.listType}">${children}</${node.tag}>`
  },
  listitem: ({ node, nodesToHTML, parent, providedCSSString }) => {
    const hasSubLists = node.children.some((child) => child.type === 'list')

    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

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
