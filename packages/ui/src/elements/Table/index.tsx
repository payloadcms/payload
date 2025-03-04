'use client'

import type { Column } from 'payload'

import './index.scss'

import React, { useEffect } from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { DraggableSortableItem } from '../DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { SortRow } from '../SortRow/index.js'

const baseClass = 'table'

// if you change this, you need to change it in a couple of places where it's duplicated
const ORDER_FIELD_NAME = '_order'

export type CellProps = {
  column: Column
  rowData: { [key: string]: unknown; id: string }
  rowIndex: number
}

export const Cell: React.FC<CellProps> = ({ column, rowData }) => {
  const { accessor } = column

  // Handle special columns
  if (accessor === '_select') {
    return <SelectRow rowData={rowData} />
  }

  if (accessor === '_dragHandle') {
    return <SortRow />
  }

  // For regular data columns, render the value
  const value = accessor ? rowData[accessor] : null
  return <>{value}</>
}

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly columns?: Column[]
  /**
   * TODO: remove in payload v4. We are using the paginatedDocs from the useListQuery provider
   */
  readonly data: { [key: string]: unknown; id: string; [ORDER_FIELD_NAME]: string }[]
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

  // The key re-render mechanism - essential for the solution
  const [renderKey, setRenderKey] = React.useState(0)
  useEffect(() => {
    setRenderKey((prev) => prev + 1)
  }, [data])

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

    const movedId = data[moveFromIndex].id
    const newBeforeRow = moveToIndex > moveFromIndex ? data[moveToIndex] : data[moveToIndex - 1]
    const newAfterRow = moveToIndex > moveFromIndex ? data[moveToIndex + 1] : data[moveToIndex]

    // Only update optimistically if we have the function available from ListQueryProvider
    if (updateDataOptimistically) {
      updateDataOptimistically((currentData) => {
        const newData = { ...currentData }
        const newDocs = [...currentData.docs]

        newDocs[moveFromIndex] = {
          ...newDocs[moveFromIndex],
          [ORDER_FIELD_NAME]: `${newBeforeRow?.[ORDER_FIELD_NAME]}_pending`,
        }

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

    //   try {
    //     // Assuming we're in the context of a collection
    //     const collectionSlug = window.location.pathname.split('/').filter(Boolean)[2]
    //     const response = await fetch(`/api/${collectionSlug}/reorder`, {
    //       body: JSON.stringify({
    //         betweenIds: [newBeforeRow?.id, newAfterRow?.id],
    //         docIds: [movedId],
    //       }),
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       method: 'POST',
    //     })

    //     if (!response.ok) {
    //       throw new Error('Failed to reorder')
    //     }

    //     // no need to update the data here, the data is updated in the useListQuery provider
    //   } catch (error) {
    //     // eslint-disable-next-line no-console
    //     console.error('Error reordering:', error)
    //     // API call failed, let the future refresh handle resetting the data
    //   }
  }

  const rowIds = data.map((row) => row.id || String(Math.random()))

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
      key={renderKey}
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
                      if (accessor === '_dragHandle') {
                        return (
                          <td className={`cell-${accessor}`} key={colIndex}>
                            <div {...attributes} {...listeners}>
                              <Cell column={col} rowData={row} rowIndex={rowIndex} />
                            </div>
                          </td>
                        )
                      }
                      return (
                        <td className={`cell-${accessor}`} key={colIndex}>
                          <Cell column={col} rowData={row} rowIndex={rowIndex} />
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
