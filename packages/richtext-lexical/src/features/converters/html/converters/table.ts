import type {
  SerializedTableCellNode,
  SerializedTableNode,
  SerializedTableRowNode,
} from '../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const TableHTMLConverter: HTMLConverters<
  SerializedTableCellNode | SerializedTableNode | SerializedTableRowNode
> = {
  table: ({ node, nodesToHTML }) => {
    // Convert child nodes to HTML and join them
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    // Wrap table in a container div, matching your JSX structure
    return `
      <div class="lexical-table-container">
        <table class="lexical-table" style="border-collapse: collapse;">
          <tbody>${children}</tbody>
        </table>
      </div>
    `
  },

  tablecell: ({ node, nodesToHTML }) => {
    // Convert child nodes to HTML and join them
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    // Determine whether this cell is a header or a regular cell
    const TagName = node.headerState > 0 ? 'th' : 'td'
    const headerStateClass = `lexical-table-cell-header-${node.headerState}`

    // Build the inline styles
    let style = 'border: 1px solid #ccc; padding: 8px;'
    if (node.backgroundColor) {
      style += ` background-color: ${node.backgroundColor};`
    }

    // Only set colSpan/rowSpan if > 1, to match your JSX logic
    const colSpanAttr = node.colSpan && node.colSpan > 1 ? ` colspan="${node.colSpan}"` : ''
    const rowSpanAttr = node.rowSpan && node.rowSpan > 1 ? ` rowspan="${node.rowSpan}"` : ''

    return `
      <${TagName}
        class="lexical-table-cell ${headerStateClass}"
        ${colSpanAttr}
        ${rowSpanAttr}
        style="${style}"
      >
        ${children}
      </${TagName}>
    `
  },

  tablerow: ({ node, nodesToHTML }) => {
    // Convert child nodes to HTML and join them
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    return `
      <tr class="lexical-table-row">
        ${children}
      </tr>
    `
  },
}
