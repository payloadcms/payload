import type {
  SerializedTableCellNode,
  SerializedTableNode,
  SerializedTableRowNode,
} from '../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const TableJSXConverter: JSXConverters<
  SerializedTableCellNode | SerializedTableNode | SerializedTableRowNode
> = {
  table: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })
    return (
      <div className="lexical-table-container">
        <table className="lexical-table" style={{ borderCollapse: 'collapse' }}>
          <tbody>{children}</tbody>
        </table>
      </div>
    )
  },
  tablecell: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })

    const TagName = node.headerState > 0 ? 'th' : 'td' // Use capital letter to denote a component
    const headerStateClass = `lexical-table-cell-header-${node.headerState}`
    const style = {
      backgroundColor: node.backgroundColor || undefined, // Use undefined to avoid setting the style property if not needed
      border: '1px solid #ccc',
      padding: '8px',
    }

    // Note: JSX does not support setting attributes directly as strings, so you must convert the colSpan and rowSpan to numbers
    const colSpan = node.colSpan && node.colSpan > 1 ? node.colSpan : undefined
    const rowSpan = node.rowSpan && node.rowSpan > 1 ? node.rowSpan : undefined

    return (
      <TagName
        className={`lexical-table-cell ${headerStateClass}`}
        colSpan={colSpan} // colSpan and rowSpan will only be added if they are not null
        rowSpan={rowSpan}
        style={style}
      >
        {children}
      </TagName>
    )
  },
  tablerow: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })
    return <tr className="lexical-table-row">{children}</tr>
  },
}
