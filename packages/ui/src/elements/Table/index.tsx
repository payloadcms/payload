'use client'

import type { Column } from 'payload'

import React from 'react'

import { useTableID } from './TableIdentity.js'
import './index.css'

const baseClass = 'table'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly BeforeTable?: React.ReactNode
  readonly columns?: Column[]
  readonly data: Record<string, unknown>[]
  readonly id?: string
}

export const Table: React.FC<Props> = ({ id, appearance, BeforeTable, columns, data }) => {
  const tableID = useTableID(id)
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
      {BeforeTable}
      <table cellPadding="0" cellSpacing="0" id={tableID}>
        <thead>
          <tr>
            {activeColumns.map((col, i) => (
              <th id={`heading-${col.accessor.replace(/\./g, '__')}`} key={i}>
                {col.Heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data &&
            data?.map((row, rowIndex) => {
              return (
                <tr
                  className={`row-${rowIndex + 1}`}
                  data-id={row.id}
                  key={
                    typeof row.id === 'string' || typeof row.id === 'number'
                      ? String(row.id)
                      : rowIndex
                  }
                >
                  {activeColumns.map((col, colIndex) => {
                    const { accessor } = col

                    return (
                      <td
                        className={[
                          `cell-${accessor.replace(/\./g, '__')}`,
                          col.isLinkedColumn && 'cell--linked',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        key={colIndex}
                      >
                        {col.renderedCells[rowIndex]}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
