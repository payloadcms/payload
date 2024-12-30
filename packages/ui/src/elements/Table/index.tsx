'use client'

import type { ClientField } from 'payload'

import React from 'react'

import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'
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
  readonly columns?: Column[]
  readonly data: Record<string, unknown>[]
  readonly enableRowSelections?: boolean
}

export const Table: React.FC<Props> = ({ appearance, columns, data, enableRowSelections }) => {
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
            {enableRowSelections ? (
              <th id="heading-_select">
                <SelectAll />
              </th>
            ) : null}
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
                {enableRowSelections ? (
                  <td className={`cell-_select`}>
                    <SelectRow rowData={row as any} />
                  </td>
                ) : null}
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
