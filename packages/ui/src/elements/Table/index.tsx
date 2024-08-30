'use client'
import type { CellComponentProps, ClientField, MappedComponent } from 'payload'

import React from 'react'

export * from './TableCellProvider/index.js'

import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTableColumns } from '../TableColumns/index.js'
import './index.scss'
import { TableCellProvider } from './TableCellProvider/index.js'

export { TableCellProvider }

const baseClass = 'table'

export type Column = {
  readonly accessor: string
  readonly active: boolean
  readonly cellProps?: Partial<CellComponentProps>
  readonly components: {
    Cell: MappedComponent
    Heading: React.ReactNode
  }
  readonly Label: React.ReactNode
}

export type Props = {
  readonly columns?: Column[]
  readonly customCellContext?: Record<string, unknown>
  readonly data: Record<string, unknown>[]
  readonly fields: ClientField[]
}

export const Table: React.FC<Props> = ({ columns: columnsFromProps, customCellContext, data }) => {
  const { columns: columnsFromContext } = useTableColumns()

  const columns = columnsFromProps || columnsFromContext

  const activeColumns = columns?.filter((col) => col?.active)

  if (!activeColumns || activeColumns.length === 0) {
    return <div>No columns selected</div>
  }

  return (
    <div className={baseClass}>
      <table cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            {activeColumns.map((col, i) => (
              <th id={`heading-${col.accessor}`} key={i}>
                {col.components.Heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data &&
            data.map((row, rowIndex) => (
              <tr className={`row-${rowIndex + 1}`} key={rowIndex}>
                {activeColumns.map((col, colIndex) => {
                  const cellData = col.cellProps?.field?._schemaPath
                    ? col.cellProps.field._schemaPath.split('.').reduce((acc, key) => {
                        return acc?.[key]
                      }, row)
                    : row[col.accessor]

                  const isLink =
                    (colIndex === 0 && col.accessor !== '_select') ||
                    (colIndex === 1 && activeColumns[0]?.accessor === '_select')

                  const cellProps = {
                    link: isLink,
                    ...(col.cellProps || {}),
                  }

                  return (
                    <td className={`cell-${col.accessor}`} key={colIndex}>
                      <TableCellProvider
                        cellData={cellData}
                        cellProps={cellProps}
                        columnIndex={colIndex}
                        customCellContext={customCellContext}
                        rowData={row}
                      >
                        <RenderComponent
                          clientProps={cellProps}
                          mappedComponent={col.components.Cell}
                        />
                      </TableCellProvider>
                    </td>
                  )
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
