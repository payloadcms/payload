'use client'

import type { ClientCollectionConfig, Column, OrderableEndpointBody } from 'payload'

import './index.scss'

import { DragOverlay } from '@dnd-kit/core'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { DraggableSortableItem } from '../DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { OrderableRow } from './OrderableRow.js'
import { OrderableRowDragPreview } from './OrderableRowDragPreview.js'

const baseClass = 'table'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly collection: ClientCollectionConfig
  readonly columns?: Column[]
  readonly data: Record<string, unknown>[]
}

export const OrderableTable: React.FC<Props> = ({
  appearance = 'default',
  collection,
  columns,
  data: initialData,
}) => {
  const { data: listQueryData, orderableFieldName, query } = useListQuery()
  // Use the data from ListQueryProvider if available, otherwise use the props
  const serverData = listQueryData?.docs || initialData

  // Local state to track the current order of rows
  const [localData, setLocalData] = useState(serverData)

  // id -> index for each column
  const [cellMap, setCellMap] = useState<Record<string, number>>({})

  const [dragActiveRowId, setDragActiveRowId] = useState<number | string | undefined>()

  // Update local data when server data changes
  useEffect(() => {
    setLocalData(serverData)
    setCellMap(
      Object.fromEntries(serverData.map((item, index) => [String(item.id ?? item._id), index])),
    )
  }, [serverData])

  const activeColumns = columns?.filter((col) => col?.active)

  if (
    !activeColumns ||
    activeColumns.filter((col) => !['_dragHandle', '_select'].includes(col.accessor)).length === 0
  ) {
    return <div>No columns selected</div>
  }

  const handleDragEnd = async ({ moveFromIndex, moveToIndex }) => {
    if (query.sort !== orderableFieldName && query.sort !== `-${orderableFieldName}`) {
      toast.warning('To reorder the rows you must first sort them by the "Order" column')
      setDragActiveRowId(undefined)
      return
    }

    if (moveFromIndex === moveToIndex) {
      setDragActiveRowId(undefined)
      return
    }

    const movedId = localData[moveFromIndex].id ?? localData[moveFromIndex]._id
    const newBeforeRow =
      moveToIndex > moveFromIndex ? localData[moveToIndex] : localData[moveToIndex - 1]
    const newAfterRow =
      moveToIndex > moveFromIndex ? localData[moveToIndex + 1] : localData[moveToIndex]

    // Store the original data for rollback
    const previousData = [...localData]

    // Optimisitc update of local state to reorder the rows
    setLocalData((currentData) => {
      const newData = [...currentData]
      // Update the rendered cell for the moved row to show "pending"
      newData[moveFromIndex][orderableFieldName] = `pending`
      // Move the item in the array
      newData.splice(moveToIndex, 0, newData.splice(moveFromIndex, 1)[0])
      return newData
    })

    try {
      const target: OrderableEndpointBody['target'] = newBeforeRow
        ? {
            id: newBeforeRow.id ?? newBeforeRow._id,
            key: newBeforeRow[orderableFieldName],
          }
        : {
            id: newAfterRow.id ?? newAfterRow._id,
            key: newAfterRow[orderableFieldName],
          }

      const newKeyWillBe =
        (newBeforeRow && query.sort === orderableFieldName) ||
        (!newBeforeRow && query.sort === `-${orderableFieldName}`)
          ? 'greater'
          : 'less'

      const jsonBody: OrderableEndpointBody = {
        collectionSlug: collection.slug,
        docsToMove: [movedId],
        newKeyWillBe,
        orderableFieldName,
        target,
      }

      const response = await fetch(`/api/reorder`, {
        body: JSON.stringify(jsonBody),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (response.status === 403) {
        throw new Error('You do not have permission to reorder these rows')
      }

      if (!response.ok) {
        throw new Error(
          'Failed to reorder. This can happen if you reorder several rows too quickly. Please try again.',
        )
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      // Rollback to previous state if the request fails
      setLocalData(previousData)
      toast.error(error)
    } finally {
      setDragActiveRowId(undefined)
    }
  }

  const handleDragStart = ({ id }) => {
    setDragActiveRowId(id)
  }

  const rowIds = localData.map((row) => row.id ?? row._id)

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      <DraggableSortable ids={rowIds} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
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
                {({ attributes, isDragging, listeners, setNodeRef, transform, transition }) => (
                  <OrderableRow
                    cellMap={cellMap}
                    className={`row-${rowIndex + 1}`}
                    columns={activeColumns}
                    dragAttributes={attributes}
                    dragListeners={listeners}
                    ref={setNodeRef}
                    rowId={row.id ?? row._id}
                    style={{
                      opacity: isDragging ? 0 : 1,
                      transform,
                      transition,
                    }}
                  />
                )}
              </DraggableSortableItem>
            ))}
          </tbody>
        </table>

        <DragOverlay>
          <OrderableRowDragPreview
            className={[baseClass, `${baseClass}--drag-preview`].join(' ')}
            rowId={dragActiveRowId}
          >
            <OrderableRow cellMap={cellMap} columns={activeColumns} rowId={dragActiveRowId} />
          </OrderableRowDragPreview>
        </DragOverlay>
      </DraggableSortable>
    </div>
  )
}
