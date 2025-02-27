'use client'

import type { Column } from 'payload'

import React from 'react'

import './index.scss'
import { DraggableSortableItem } from '../DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'

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

  const handleDragEnd = ({ moveFromIndex, moveToIndex }) => {
    console.log('Moved row from', moveFromIndex, 'to', moveToIndex)
  }

  const rowIds = data.map((row) => row.id || String(Math.random()))

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      <DraggableSortable dragHandleSelector=".sort-row" ids={rowIds} onDragEnd={handleDragEnd}>
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
            {data.map((row, rowIndex) => (
              <DraggableSortableItem id={rowIds[rowIndex]} key={rowIds[rowIndex]}>
                {({ attributes, listeners, setNodeRef, transform, transition }) => (
                  <tr
                    className={`row-${rowIndex + 1}`}
                    ref={setNodeRef}
                    style={{
                      transform,
                      transition,
                    }}
                  >
                    {activeColumns.map((col, colIndex) => {
                      const { accessor } = col
                      if (accessor === '_dragHandle') {
                        return (
                          <td className={`cell-${accessor}`} key={colIndex}>
                            <div {...attributes} {...listeners}>
                              {col.renderedCells[rowIndex]}
                            </div>
                          </td>
                        )
                      }
                      return (
                        <td className={`cell-${accessor}`} key={colIndex}>
                          {col.renderedCells[rowIndex]}
                        </td>
                      )
                    })}
                  </tr>
                )}
              </DraggableSortableItem>
            ))}
          </tbody>
        </table>
      </DraggableSortable>
    </div>
  )
}
