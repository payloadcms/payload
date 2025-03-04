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
  readonly data: { [key: string]: unknown; id: string; [ORDER_FIELD_NAME]?: string }[]
  readonly onDragEnd?: (data: { moveFromIndex: number; moveToIndex: number }) => void
}

export const Table: React.FC<Props> = ({
  appearance = 'default',
  columns,
  data: initialData,
  onDragEnd: propOnDragEnd,
}) => {
  const { data: listQueryData, handleSortChange, query } = useListQuery()
  const [idToOriginalIndex, setIdToOriginalIndex] = useState(
    () => new Map(initialData.map((item, index) => [String(item.id), index])),
  )
  // Use the data from ListQueryProvider if available, otherwise use the props
  const serverData = listQueryData?.docs || initialData

  // Local state to track the current order of rows
  const [localData, setLocalData] = useState(serverData)

  // Update local data when server data changes
  useEffect(() => {
    setLocalData(serverData)
    setIdToOriginalIndex(new Map(serverData.map((item, index) => [String(item.id), index])))
  }, [serverData])

  // Force re-sort when query sort changes
  useEffect(() => {
    if (query?.sort) {
      void handleSortChange(query.sort as string).catch((error) => {
        throw error
      })
    }
  }, [handleSortChange, query?.sort])

  const activeColumns = columns?.filter((col) => col?.active)

  if (
    !activeColumns ||
    activeColumns.filter((col) => !['_dragHandle', '_select'].includes(col.accessor)).length === 0
  ) {
    return <div>No columns selected</div>
  }

  const handleDragEnd = async ({ moveFromIndex, moveToIndex }) => {
    if (moveFromIndex === moveToIndex) {
      return
    }

    // Update local state to reorder the rows
    setLocalData((currentData) => {
      const newData = [...currentData]

      // Move the item in the array
      newData.splice(moveToIndex, 0, newData.splice(moveFromIndex, 1)[0])

      return newData
    })

    // Still call the prop onDragEnd if provided - for server updates
    if (propOnDragEnd) {
      propOnDragEnd({ moveFromIndex, moveToIndex })
    }
  }

  const rowIds = localData.map((row) => row.id || String(Math.random()))
  const isSortable = localData.length > 0 && ORDER_FIELD_NAME in localData[0]

  // Get the correct cell for a given row ID
  const getCellForRow = (renderedCells, currentRowId) => {
    const originalIndex = idToOriginalIndex.get(currentRowId)

    // If we have a mapping for this ID, return the corresponding cell
    if (originalIndex !== undefined && originalIndex < renderedCells.length) {
      return renderedCells[originalIndex]
    }

    // Fallback: if not found in map, try to find in the current data
    // This happens when new data is added that wasn't in the original server render
    const currentIndex = serverData.findIndex((row) => String(row.id) === currentRowId)
    if (currentIndex >= 0 && currentIndex < renderedCells.length) {
      return renderedCells[currentIndex]
    }

    return null
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
            {localData.map((row, rowIndex) => (
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
