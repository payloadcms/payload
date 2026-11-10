import type {
  SerializedTableCellNode,
  SerializedTableNode,
  SerializedTableRowNode,
} from '../../../../../nodeTypes.js'
import type { HTMLConvertersAsync } from '../types.js'

import { isSafeCssColor } from '../../shared/cssColors.js'

export const TableHTMLConverterAsync: HTMLConvertersAsync<
  SerializedTableCellNode | SerializedTableNode | SerializedTableRowNode
> = {
  table: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    return `<div${providedStyleTag} class="lexical-table-container">
        <table class="lexical-table" style="border-collapse: collapse;">
          <tbody>${children}</tbody>
        </table>
      </div>`
  },

  tablecell: async ({ node, nodesToHTML, providedCSSString }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    // Stored JSON is not type-checked, so only numbers may be interpolated into attributes
    const headerState = typeof node.headerState === 'number' ? node.headerState : 0
    const TagName = headerState > 0 ? 'th' : 'td'
    const headerStateClass = `lexical-table-cell-header-${headerState}`

    let style = 'border: 1px solid #ccc; padding: 8px;' + providedCSSString
    if (node.backgroundColor && isSafeCssColor(node.backgroundColor)) {
      style += ` background-color: ${node.backgroundColor};`
    }

    const colSpanAttr =
      typeof node.colSpan === 'number' && node.colSpan > 1 ? ` colspan="${node.colSpan}"` : ''
    const rowSpanAttr =
      typeof node.rowSpan === 'number' && node.rowSpan > 1 ? ` rowspan="${node.rowSpan}"` : ''

    return `<${TagName}
        class="lexical-table-cell ${headerStateClass}"
        ${colSpanAttr}
        ${rowSpanAttr}
        style="${style}"
      >
        ${children}
      </${TagName}>
    `
  },

  tablerow: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    return `<tr${providedStyleTag} class="lexical-table-row">
        ${children}
      </tr>`
  },
}
