import { CheckIcon } from '@payloadcms/ui/shared'
import { v4 as uuidv4 } from 'uuid'

import type { HTMLConvertersAsync } from '../../../../features/converters/lexicalToHtml/async/types.js'
import type { SerializedListItemNode } from '../../../../nodeTypes.js'

import './index.scss'

export const ListItemDiffHTMLConverterAsync: HTMLConvertersAsync<SerializedListItemNode> = {
  listitem: async ({ node, nodesToHTML, parent, providedCSSString }) => {
    const hasSubLists = node.children.some((child) => child.type === 'list')

    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    if ('listType' in parent && parent?.listType === 'check') {
      const ReactDOMServer = (await import('react-dom/server')).default

      const uuid = uuidv4()
      const JSX = (
        <li
          aria-checked={node.checked ? true : false}
          className={`list-item-checkbox${node.checked ? ' list-item-checkbox-checked' : ' list-item-checkbox-unchecked'}${hasSubLists ? ' nestedListItem' : ''}`}
          data-enable-match="true"
          role="checkbox"
          tabIndex={-1}
          value={node.value}
        >
          {hasSubLists ? (
            <div dangerouslySetInnerHTML={{ __html: children }} />
          ) : (
            <>
              <input checked={node.checked} id={uuid} readOnly={true} type="checkbox" />
              <label htmlFor={uuid}>{children}</label>
              <CheckIcon />
              <br />
            </>
          )}
        </li>
      )

      const html = ReactDOMServer.renderToString(JSX)

      // Add style="list-style-type: none;${providedCSSString}" to html
      const styleIndex = html.indexOf('class="list-item-checkbox')
      const classIndex = html.indexOf('class="list-item-checkbox', styleIndex)
      const classEndIndex = html.indexOf('"', classIndex + 6)
      const className = html.substring(classIndex, classEndIndex)
      const classNameWithStyle = `${className} style="list-style-type: none;${providedCSSString}"`
      const htmlWithStyle = html.replace(className, classNameWithStyle)

      return htmlWithStyle
    } else {
      return `<li
          class="${hasSubLists ? 'nestedListItem' : ''}"
          style="${hasSubLists ? `list-style-type: none;${providedCSSString}` : providedCSSString}"
          value="${node.value}"
          data-enable-match="true"
        >${children}</li>`
    }
  },
}
