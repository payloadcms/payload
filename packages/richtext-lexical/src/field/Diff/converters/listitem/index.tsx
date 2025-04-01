import { CheckIcon } from '@payloadcms/ui/rsc'

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

      const JSX = (
        <li
          aria-checked={node.checked ? true : false}
          className={`checkboxItem ${node.checked ? 'checkboxItem--checked' : 'checkboxItem--unchecked'}${
            hasSubLists ? ' checkboxItem--nested' : ''
          }`}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
          role="checkbox"
          tabIndex={-1}
          value={node.value}
        >
          {hasSubLists ? (
            // When sublists exist, just render them safely as HTML
            <div dangerouslySetInnerHTML={{ __html: children }} />
          ) : (
            // Otherwise, show our custom styled checkbox
            <div className="checkboxItem__wrapper">
              <div
                className="checkboxItem__icon"
                data-checked={node.checked}
                data-enable-match="true"
              >
                {node.checked && <CheckIcon />}
              </div>
              <span className="checkboxItem__label">{children}</span>
            </div>
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
