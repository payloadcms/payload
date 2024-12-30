'use client'

import type { ClientField } from 'payload'

import React from 'react'

import './index.scss'

const baseClass = 'table'

export type Column = {
  readonly accessor: string
  readonly active: boolean
  readonly CustomLabel?: React.ReactNode
  readonly field: ClientField
  readonly Heading: React.ReactNode
  readonly renderedCells: React.ReactNode[]
}

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly beforeRows?: Column[]
  readonly columns?: Column[]
  readonly data: Record<string, unknown>[]
}

export const Table: React.FC<Props> = ({ appearance, beforeRows, columns, data }) => {
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
            {beforeRows
              ? beforeRows.map((col, i) => (
                  <th id={`heading-${col.accessor}`} key={i}>
                    {col.Heading}
                  </th>
                ))
              : null}
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
                {beforeRows
                  ? beforeRows.map((col, colIndex) => {
                      const { accessor } = col

                      return (
                        <td className={`cell-${accessor}`} key={colIndex}>
                          {col.renderedCells[rowIndex]}
                        </td>
                      )
                    })
                  : null}
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
