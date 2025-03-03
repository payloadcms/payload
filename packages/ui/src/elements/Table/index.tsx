'use client'

import type { Column } from 'payload'

import './index.scss'

import React from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
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
}

export const Table: React.FC<Props> = ({ appearance, columns: columnsFromProps }) => {
  const { handleSortChange, query } = useListQuery()
  const { data: paginatedDocs } = useListQuery()
  const [data, setData] = React.useState(paginatedDocs.docs)
  const [columns, setColumns] = React.useState(columnsFromProps)

  console.log('columns', columns, paginatedDocs)

  // Force re-sort when data changes
  React.useEffect(() => {
    if (query.sort) {
      void handleSortChange(query.sort as string).catch((error) => {
        throw error
      })
    }
  }, [data, handleSortChange, query.sort])

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

    // To debug:
    // console.log(
    //   `moving ${data[moveFromIndex]?.text} between ${newBeforeRow?.text} and ${newAfterRow?.text}`,
    // )

    // Store the original data for rollback
    const previousData = [...data]

    // TODO: this optimistic update is not working (the table is not re-rendered)
    // you can't debug it commenting the try block. Every move needs to be followed by
    // a refresh of the page to see the changes.
    setData((currentData) => {
      const newData = [...currentData]
      newData[moveFromIndex] = {
        ...newData[moveFromIndex],
        [ORDER_FIELD_NAME]: `${newBeforeRow?.[ORDER_FIELD_NAME]}_pending`,
      }
      // move from index to moveToIndex
      newData.splice(moveToIndex, 0, newData.splice(moveFromIndex, 1)[0])

      return newData
    })

    try {
      // Assuming we're in the context of a collection
      const collectionSlug = window.location.pathname.split('/').filter(Boolean)[2]
      const response = await fetch(`/api/${collectionSlug}/reorder`, {
        body: JSON.stringify({
          betweenIds: [newBeforeRow?.id, newAfterRow?.id],
          docIds: [movedId],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reorder')
      }

      // no need to update the data here, the data is updated in the useListQuery provider
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reordering:', error)
      // Rollback to previous state if the request fails
      setData(previousData)
      // Optionally show an error notification
    }
  }

  const rowIds = data.map((row) => row.id || String(Math.random()))

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
                      if (accessor === '_dragHandle') {
                        return (
                          <td className={`cell-${accessor}`} key={colIndex}>
                            <div {...attributes} {...listeners}>
                              <Cell col={col} rowIndex={rowIndex} />
                              {/* {col.renderedCells[rowIndex]} */}
                            </div>
                          </td>
                        )
                      }
                      return (
                        <td className={`cell-${accessor}`} key={colIndex}>
                          <Cell col={col} rowIndex={rowIndex} />
                          {/* {col.renderedCells[rowIndex]} */}
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

// ... existing code ...

const Cell: React.FC<{ col: Column; rowIndex: number }> = ({ col, rowIndex }) => {
  const { data } = useListQuery()
  const { accessor } = col
  const { i18n } = useTranslation()

  if (accessor === 'collection') {
    const doc = data.docs[rowIndex]
    return (
      <Pill>
        {/* {getTranslation(
          collections ? payload.collections[doc.relationTo].config.labels.singular :
          clientCollectionConfig.labels.singular,
          i18n,
        )} */}
      </Pill>
    )
  }

  if (accessor === '_select') {
    return <SelectRow rowData={data.docs[rowIndex]} />
  }

  if (accessor === '_dragHandle') {
    return <SortRow />
  }

  // For all other columns, render the value from the data
  const cellData = data.docs[rowIndex][accessor]
  return <>{cellData}</>
}

// ... existing code ...
