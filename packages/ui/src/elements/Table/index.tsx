'use client'

import type { Column } from 'payload'

import './index.scss'

import React from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { DraggableSortableItem } from '../DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { Pill } from '../Pill/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { SortRow } from '../SortRow/index.js'

const baseClass = 'table'

// if you change this, you need to change it in a couple of places where it's duplicated
const ORDER_FIELD_NAME = '_order'

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

  // Force re-sort when data changes
  React.useEffect(() => {
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

  // Dynamically render cells based on current data
  const columnsWithDynamicCells = activeColumns.map((column) => {
    // Keep special columns like '_select' or '_dragHandle' as is
    if (
      column.accessor === '_select' ||
      column.accessor === '_dragHandle' ||
      column.accessor === 'collection'
    ) {
      return column
    }

    // For other columns, dynamically generate cells based on current data
    return {
      ...column,
      renderedCells: data.map((doc, rowIndex) => {
        if (column.renderedCells && column.renderedCells[rowIndex]) {
          const Cell = column.renderedCells[rowIndex]
          return React.isValidElement(Cell)
            ? React.cloneElement(Cell, { data: doc, rowData: doc })
            : Cell
        }

        // Fallback for columns without custom renderers
        return doc[column.accessor] || null
      }),
    }
  })

  // Add special columns as needed
  const finalColumns = [...columnsWithDynamicCells]

  // Add row selection column if needed (this would normally be in the original columns)
  const hasSelectionColumn = columns.some((col) => col.accessor === '_select')
  if (!hasSelectionColumn && finalColumns.find((col) => col.accessor === '_select')) {
    finalColumns.unshift({
      accessor: '_select',
      active: true,
      Heading: 'Select',
      renderedCells: data.map((doc, i) => <SelectRow key={i} rowData={doc} />),
    } as Column)
  }

  // Add drag handle if data is sortable
  const isSortable = data.length > 0 && ORDER_FIELD_NAME in data[0]
  if (isSortable && !finalColumns.find((col) => col.accessor === '_dragHandle')) {
    finalColumns.unshift({
      accessor: '_dragHandle',
      active: true,
      Heading: '',
      renderedCells: data.map((_, i) => <SortRow key={i} />),
    } as Column)
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

  // The key re-render mechanism - essential for the solution
  const [renderKey, setRenderKey] = React.useState(0)
  React.useEffect(() => {
    setRenderKey((prev) => prev + 1)
  }, [data])

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
              {finalColumns.map((col, i) => (
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
                    {finalColumns.map((col, colIndex) => {
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
