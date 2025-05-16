'use client'

import type { Column } from 'payload'

import React from 'react'

import './index.scss'

const baseClass = 'table'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly columns?: Column[]
  readonly data: Record<string, unknown>[]
}

export const Table: React.FC<Props> = ({ appearance, columns, data }) => {
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
              <tr
                className={`row-${rowIndex + 1}`}
                key={
                  typeof row.id === 'string' || typeof row.id === 'number'
                    ? String(row.id)
                    : rowIndex
                }
              >
                {activeColumns.map((col, colIndex) => {
                  const { accessor } = col

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
