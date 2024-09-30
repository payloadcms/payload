'use client'
import type { CellComponentProps, ClientField } from 'payload'

import React from 'react'

export * from './TableCellProvider/index.js'

import { useTableColumns } from '../TableColumns/index.js'
import './index.scss'
import { RenderCell } from './RenderCell.js'
import { TableCellProvider } from './TableCellProvider/index.js'

export { TableCellProvider }

const baseClass = 'table'

export type Column = {
  readonly accessor: string
  readonly active: boolean
  readonly cellProps?: Partial<CellComponentProps>
  readonly Heading: React.ReactNode
}

export type Props = {
  readonly appearance?: 'condensed' | 'default'
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
                  const isLink =
                    (colIndex === 0 && col.accessor !== '_select') ||
                    (colIndex === 1 && activeColumns[0]?.accessor === '_select')

                  return (
                    <RenderCell
                      cellProps={{
                        link: isLink,
                        ...cellProps?.[colIndex],
                      }}
                      col={col}
                      colIndex={colIndex}
                      customCellContext={customCellContext}
                      key={colIndex}
                      row={row}
                    />
                  )
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
