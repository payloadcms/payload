'use client'
import type { CellComponentProps, ClientField } from 'payload'

import React from 'react'

import { useTableColumns } from '../TableColumns/index.js'
import './index.scss'

const baseClass = 'table'

export type Column = {
  readonly accessor: string
  readonly active: boolean
  readonly cellProps?: Partial<CellComponentProps>
}

export type RenderedCells = {
  cells: Map<string, React.ReactNode>
  headings: Map<string, React.ReactNode>
}

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly columns?: Column[]
  readonly customCellContext?: Record<string, unknown>
  readonly data: Record<string, unknown>[]
  readonly fields: ClientField[]
  readonly renderedCells?: RenderedCells
}

export const Table: React.FC<Props> = ({
  appearance,
  columns: columnsFromProps,
  customCellContext,
  data,
  renderedCells: initialCells,
}) => {
  const [renderedCells, setRenderedCells] = React.useState(initialCells)

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
                {renderedCells?.headings?.get(col.accessor)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data &&
            data.map((row, rowIndex) => (
              <tr className={`row-${rowIndex + 1}`} key={rowIndex}>
                {activeColumns.map((col, colIndex) => (
                  <td className={`cell-${col.accessor}`} key={colIndex}>
                    {renderedCells?.cells?.get(`${col.accessor}.${rowIndex}`)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
