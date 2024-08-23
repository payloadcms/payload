'use client'
import type { CellComponentProps, ClientField } from 'payload'

import React from 'react'

export * from './TableCellProvider/index.js'

import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTableColumns } from '../TableColumns/index.js'
import { TableCellProvider } from './TableCellProvider/index.js'
import './index.scss'

export { TableCellProvider }

const baseClass = 'table'

export type Column = {
  readonly Heading: React.ReactNode
  readonly accessor: string
  readonly active: boolean
  readonly cellProps?: Partial<CellComponentProps>
}

export type Props = {
  readonly appearance?: 'compact' | 'default'
  readonly columns?: Column[]
  readonly customCellContext?: Record<string, unknown>
  readonly data: Record<string, unknown>[]
  readonly fields: ClientField[]
}

export const Table: React.FC<Props> = ({
  appearance,
  columns: columnsFromProps,
  customCellContext,
  data,
}) => {
  const { cellProps, columns: columnsFromContext } = useTableColumns()

  const columns = columnsFromProps || columnsFromContext

  const activeColumns = columns?.filter((col) => col?.active)

  if (!activeColumns || activeColumns.length === 0) {
    return <div>No columns selected</div>
  }

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      <table cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            {activeColumns.map((col, i) => (
              <th id={`heading-${col.accessor}`} key={i}>
                {col.Heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data &&
            data.map((row, rowIndex) => (
              <tr className={`row-${rowIndex + 1}`} key={rowIndex}>
                {activeColumns.map((col, colIndex) => {
                  return (
                    <td className={`cell-${col.accessor}`} key={colIndex}>
                      <TableCellProvider
                        cellData={row[col.accessor]}
                        cellProps={col?.cellProps}
                        columnIndex={colIndex}
                        customCellContext={customCellContext}
                        rowData={row}
                      >
                        <RenderComponent
                          clientProps={{
                            ...(cellProps[colIndex] || {}),
                            ...col?.cellProps,
                            field: {
                              ...(cellProps[colIndex]?.field || {}),
                              ...col?.cellProps?.field,
                              admin: {
                                ...(cellProps[colIndex]?.field?.admin || {}),
                                ...col?.cellProps?.field?.admin,
                                components: {
                                  ...(cellProps[colIndex]?.field?.admin?.components || {}),
                                  ...col?.cellProps?.field?.admin?.components,
                                },
                              },
                            },
                          }}
                          mappedComponent={
                            cellProps[colIndex]?.field?.admin?.components?.Cell ||
                            col.cellProps?.field?.admin?.components?.Cell
                          }
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
