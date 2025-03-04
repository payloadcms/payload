'use client'

import type { Column } from 'payload'

import './index.scss'

import React, { useEffect, useState } from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { DraggableSortableItem } from '../DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'

const baseClass = 'table'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly columns?: Column[]
  readonly data: { [key: string]: unknown; id: string }[]
}

export const Table: React.FC<Props> = ({ appearance = 'default', columns, data: initialData }) => {
  const { data: listQueryData } = useListQuery()
  // Use the data from ListQueryProvider if available, otherwise use the props
  const serverData = listQueryData?.docs || initialData

  // Local state to track the current order of rows
  const [localData, setLocalData] = useState(serverData)

  // id -> index for each column
  const [cellMap, setCellMap] = useState<Record<string, number>>({})

  // Update local data when server data changes
  useEffect(() => {
    setLocalData(serverData)
    setCellMap(Object.fromEntries(serverData.map((item, index) => [String(item.id), index])))
  }, [serverData])

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
  }

  const rowIds = localData.map((row) => row.id)

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

                      // Use the cellMap to find which index in the renderedCells to use
                      const cell = col.renderedCells[cellMap[row.id]]

                      // For drag handles, wrap in div with drag attributes
                      if (accessor === '_dragHandle') {
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
