'use client'

import type { Column } from 'payload'

import './index.scss'

import React, { useEffect, useState } from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { DraggableSortableItem } from '../DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'

const baseClass = 'table'

// if you change this, you need to change it in a couple of places where it's duplicated
const ORDER_FIELD_NAME = '_order'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly columns?: Column[]
  readonly data: { [key: string]: unknown; id: string }[]
  readonly onDragEnd?: (data: { moveFromIndex: number; moveToIndex: number }) => void
}

export const Table: React.FC<Props> = ({
  appearance = 'default',
  columns,
  data: initialData,
  onDragEnd: propOnDragEnd,
}) => {
  const { data: listQueryData, handleSortChange, query, updateDataOptimistically } = useListQuery()

  // Use the data from ListQueryProvider if available, otherwise use the props
  const data = listQueryData?.docs || initialData

  // The original order of ids as they were in the server-rendered cells
  const [originalIds] = useState(() => initialData.map((item) => String(item.id)))

  // Force re-sort when data changes
  useEffect(() => {
    if (query?.sort) {
      void handleSortChange(query.sort as string).catch((error) => {
        throw error
      })
    }
  }, [handleSortChange, query?.sort])

  const activeColumns = columns?.filter((col) => col?.active)

  if (!activeColumns || activeColumns.length === 0) {
    return <div>No columns selected</div>
  }

  const handleDragEnd = async ({ moveFromIndex, moveToIndex }) => {
    if (moveFromIndex === moveToIndex) {
      return
    }

    // Only update optimistically if we have the function available from ListQueryProvider
    if (updateDataOptimistically) {
      updateDataOptimistically((currentData) => {
        const newData = { ...currentData }
        const newDocs = [...currentData.docs]

        // Move the item in the array
        newDocs.splice(moveToIndex, 0, newDocs.splice(moveFromIndex, 1)[0])

        newData.docs = newDocs
        return newData
      })
    }

    // Call the prop onDragEnd if provided
    if (propOnDragEnd) {
      propOnDragEnd({ moveFromIndex, moveToIndex })
    }
  }

  const rowIds = data.map((row) => row.id || String(Math.random()))
  const isSortable = data.length > 0 && ORDER_FIELD_NAME in data[0]

  // Get the cell at the correct position by mapping through original order
  const getCellForRow = (renderedCells, currentRowId) => {
    // Find where in the original array this id was
    const originalIndex = originalIds.findIndex((id) => id === currentRowId)

    // If found, return the corresponding cell, otherwise return null
    return originalIndex >= 0 && originalIndex < renderedCells.length
      ? renderedCells[originalIndex]
      : null
  }

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      <DraggableSortable ids={rowIds} onDragEnd={handleDragEnd}>
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

                      // Get cell by matching ids from original order
                      const cell = getCellForRow(col.renderedCells, String(row.id))

                      // For drag handles, wrap in div with drag attributes
                      if (isSortable && accessor === '_dragHandle') {
                        return (
                          <td className={`cell-${accessor}`} key={colIndex}>
                            <div {...attributes} {...listeners}>
                              {cell}
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td className={`cell-${accessor}`} key={colIndex}>
                          {cell}
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
