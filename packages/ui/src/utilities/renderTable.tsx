import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  CollectionConfig,
  Field,
  ImportMap,
  ListPreferences,
  PaginatedDocs,
  Payload,
  SanitizedCollectionConfig,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { fieldAffectsData, fieldIsHiddenOrDisabled, flattenTopLevelFields } from 'payload/shared'
import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import type { Column } from '../exports/client/index.js'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { DraggableSortableItem } from '../elements/DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../elements/DraggableSortable/index.js'
import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { SortRow } from '../elements/SortRow/index.js'
import { baseClass } from '../elements/Table/index.js'
import { buildColumnState } from '../elements/TableColumns/buildColumnState.js'
import { buildPolymorphicColumnState } from '../elements/TableColumns/buildPolymorphicColumnState.js'
import { filterFields } from '../elements/TableColumns/filterFields.js'
import { getInitialColumns } from '../elements/TableColumns/getInitialColumns.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { Pill, SelectAll, SelectRow, Table } from '../exports/client/index.js'

export const renderFilters = (
  fields: Field[],
  importMap: ImportMap,
): Map<string, React.ReactNode> =>
  fields.reduce(
    (acc, field) => {
      if (fieldIsHiddenOrDisabled(field)) {
        return acc
      }

      if ('name' in field && field.admin?.components?.Filter) {
        acc.set(
          field.name,
          RenderServerComponent({
            Component: field.admin.components?.Filter,
            importMap,
          }),
        )
      }

      return acc
    },
    new Map() as Map<string, React.ReactNode>,
  )

export const ORDER_FIELD_NAME = '_order'

export const renderTable = ({
  clientCollectionConfig,
  clientConfig,
  collectionConfig,
  collections,
  columnPreferences,
  columns: columnsArg = null,
  docs,
  enableRowSelections = false,
  getRowPadding,
  i18n,
  importMap,
  noDragHandle,
  payload,
  renderRowTypes,
  tableAppearance = 'default',
  useAsTitle,
}: RenderTableReturnArgs): {
  columnState: Column[]
  Table: React.ReactNode
} => {
  // Ensure that columns passed as args comply with the field config, i.e. `hidden`, `disableListColumn`, etc.

  let columnState: Column[]

  if (collections) {
    const fields: ClientField[] = []
    for (const collection of collections) {
      const config = clientConfig.collections.find((each) => each.slug === collection)

      for (const field of filterFields(config.fields)) {
        if (fieldAffectsData(field)) {
          if (fields.some((each) => fieldAffectsData(each) && each.name === field.name)) {
            continue
          }
        }

        fields.push(field)
      }
    }

    const columns = columnsArg
      ? columnsArg?.filter((column) =>
          flattenTopLevelFields(fields, true)?.some(
            (field) => 'name' in field && field.name === column.accessor,
          ),
        )
      : getInitialColumns(fields, useAsTitle, [])

    columnState = buildPolymorphicColumnState({
      columnPreferences,
      columns,
      enableRowSelections,
      fields,
      i18n,
      // sortColumnProps,
      docs,
      getRowPadding,
      payload,
      useAsTitle,
    })
  } else {
    const columns = columnsArg
      ? columnsArg?.filter((column) =>
          flattenTopLevelFields(clientCollectionConfig.fields, true)?.some(
            (field) => 'name' in field && field.name === column.accessor,
          ),
        )
      : getInitialColumns(
          filterFields(clientCollectionConfig.fields),
          useAsTitle,
          clientCollectionConfig?.admin?.defaultColumns,
        )

    columnState = buildColumnState({
      clientCollectionConfig,
      collectionConfig,
      columnPreferences,
      columns,
      enableRowSelections,
      i18n,
      // sortColumnProps,
      docs,
      getRowPadding,
      payload,
      useAsTitle,
    })
  }

  const columnsToUse = columnState.map((column) => {
    // Remove all renderedCells since they'll be created dynamically in the Table component
    const { renderedCells, ...columnWithoutCells } = column
    return columnWithoutCells
  })

  if (renderRowTypes) {
    columnsToUse.unshift({
      accessor: 'collection',
      active: true,
      field: {
        admin: {
          disabled: true,
        },
        hidden: true,
      },
      Heading: i18n.t('version:type'),
      renderedCells: docs.map((doc, i) => (
        <Pill key={i}>
          {getTranslation(
            collections
              ? payload.collections[doc.relationTo].config.labels.singular
              : clientCollectionConfig.labels.singular,
            i18n,
          )}
        </Pill>
      )),
    } as Column)
  }

  if (enableRowSelections) {
    columnsToUse.unshift({
      accessor: '_select',
      active: true,
      field: {
        admin: {
          disabled: true,
        },
        hidden: true,
      },
      Heading: <SelectAll />,
      renderedCells: docs.map((_, i) => <SelectRow key={i} rowData={docs[i]} />),
    } as Column)
  }

  const isSortable = docs.length > 0 && ORDER_FIELD_NAME in docs[0]

  if (isSortable) {
    // show drag handle
    columnsToUse.unshift({
      accessor: '_dragHandle',
      active: true,
      field: {
        admin: {
          disabled: true,
        },
        hidden: true,
      },
      Heading: '', // Empty header
      renderedCells: docs.map((_, i) => <SortRow key={i} />),
    } as Column)

    // show order as integer
    // const orderColumn = columnsToUse.find((column) => column.accessor === ORDER_FIELD_NAME)
    // if (orderColumn) {
    //   const cells = docs.map((doc, i) => (
    //     <React.Fragment key={i}>{doc.orderAsInteger}</React.Fragment>
    //   ))
    //   // @ts-expect-error - renderedCells is read-only
    //   orderColumn.renderedCells = cells
    // }
  }

  // const onDragEnd = async ({ moveFromIndex, moveToIndex }) => {
  //   if (moveFromIndex === moveToIndex) {
  //     return
  //   }

  //   const movedId = data[moveFromIndex].id
  //   const newBeforeRow = moveToIndex > moveFromIndex ? data[moveToIndex] : data[moveToIndex - 1]
  //   const newAfterRow = moveToIndex > moveFromIndex ? data[moveToIndex + 1] : data[moveToIndex]

  //   // To debug:
  //   // console.log(
  //   //   `moving ${data[moveFromIndex]?.text} between ${newBeforeRow?.text} and ${newAfterRow?.text}`,
  //   // )

  //   // Store the original data for rollback
  //   const previousData = [...data]

  //   // TODO: this optimistic update is not working (the table is not re-rendered)
  //   // you can't debug it commenting the try block. Every move needs to be followed by
  //   // a refresh of the page to see the changes.
  //   setData((currentData) => {
  //     const newData = [...currentData]
  //     newData[moveFromIndex] = {
  //       ...newData[moveFromIndex],
  //       [ORDER_FIELD_NAME]: `${newBeforeRow?.[ORDER_FIELD_NAME]}_pending`,
  //     }
  //     // move from index to moveToIndex
  //     newData.splice(moveToIndex, 0, newData.splice(moveFromIndex, 1)[0])

  //     return newData
  //   })

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
  //     // Rollback to previous state if the request fails
  //     setData(previousData)
  //     // Optionally show an error notification
  //   }
  // }

  return {
    columnState,
    Table: <Table appearance={tableAppearance} columns={columnsToUse} data={docs} />,
  }
}
