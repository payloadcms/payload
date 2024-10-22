'use client'

import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import './index.scss'

const baseClass = 'table'

export type Column = {
  readonly accessor: string
  readonly active: boolean
  readonly cellProps?: Partial<DefaultCellComponentProps>
  readonly Heading: React.ReactNode
  readonly renderedCells: React.ReactNode[]
}

export { TableCellProvider, useTableCell } from './TableCellProvider/index.js'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly columns?: Column[]
  readonly customCellContext?: Record<string, unknown>
  readonly data: Record<string, unknown>[]
}

export const Table: React.FC<Props> = ({ appearance, columns, customCellContext, data }) => {
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
                  const { accessor } = col

                  const isLink =
                    (colIndex === 0 && accessor !== '_select') ||
                    (colIndex === 1 && activeColumns[0]?.accessor === '_select')

                  return (
                    <td className={`cell-${accessor}`} key={colIndex}>
                      {col.renderedCells[rowIndex]}
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
