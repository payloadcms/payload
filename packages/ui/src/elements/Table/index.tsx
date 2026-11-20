'use client'

import type { Column, NestedDocRow, Sort } from 'payload'

import React, { useRef } from 'react'

import { useNestedDocsTree } from '../../providers/NestedDocs/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useGridNavigation } from './GridNavigation/useGridNavigation.js'
import { NestedDocsBranchRow } from './NestedDocsBranchRow/index.js'
import { NestedDocsContinuationRow } from './NestedDocsContinuationRow/index.js'
import { TableGridContext, useTableID, useTableNavigationLabel } from './TableIdentity.js'
import { TableRow } from './TableRow/index.js'
import './index.css'

const baseClass = 'table'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly ariaLabel?: string
  readonly BeforeTable?: React.ReactNode
  readonly columns?: Column[]
  readonly data: Record<string, unknown>[]
  readonly id?: string
  readonly navigationLabel?: string
  readonly nestedDocs?: {
    collectionSlug: string
    rows: Record<string, NestedDocRow>
    sort?: Sort
  }
  readonly useAsTitle?: string
}

export const Table: React.FC<Props> = ({
  id,
  appearance,
  ariaLabel,
  BeforeTable,
  columns: originalColumns,
  data: originalData,
  navigationLabel: navigationLabelFromProps,
  nestedDocs,
  useAsTitle,
}) => {
  const tree = useNestedDocsTree()
  const { t } = useTranslation()
  const data = nestedDocs && tree ? tree.docs : originalData
  const nestedDocRows = nestedDocs && tree ? tree.rows : nestedDocs?.rows
  const selectionColumn = originalColumns?.find((column) => column.accessor === '_select')
  const selectionCells = selectionColumn
    ? new Map(
        originalData.map((doc, index) => [
          typeof doc.id === 'string' || typeof doc.id === 'number' ? String(doc.id) : '',
          selectionColumn.renderedCells[index],
        ]),
      )
    : undefined
  const columns =
    nestedDocs && tree
      ? [
          ...(selectionColumn
            ? [
                {
                  ...selectionColumn,
                  renderedCells: data.map((doc) => selectionCells?.get(String(doc.id))),
                },
              ]
            : []),
          ...tree.columns,
        ]
      : originalColumns
  const tableID = useTableID(id)
  const navigationLabelFromContext = useTableNavigationLabel()
  const navigationLabel = navigationLabelFromProps ?? navigationLabelFromContext
  const tableRef = useRef<HTMLTableElement>(null)
  const isGrid = Boolean(navigationLabel)

  const activeColumns = columns?.filter((col) => col?.active)
  const hasRowSelection = isGrid && activeColumns?.some((column) => column.accessor === '_select')

  useGridNavigation({ id, isEnabled: isGrid && Boolean(activeColumns?.length), ref: tableRef })

  if (!activeColumns || activeColumns.length === 0) {
    return <div>No columns selected</div>
  }

  return (
    <div
      className={[
        baseClass,
        appearance && `${baseClass}--appearance-${appearance}`,
        nestedDocs && `${baseClass}--nested-docs`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {BeforeTable}
      <TableGridContext value={isGrid}>
        <table
          aria-label={ariaLabel ?? navigationLabel}
          aria-multiselectable={hasRowSelection || undefined}
          cellPadding="0"
          cellSpacing="0"
          id={tableID}
          ref={tableRef}
          role={isGrid ? 'grid' : undefined}
        >
          <thead>
            <tr role={isGrid ? 'row' : undefined}>
              {activeColumns.map((col) => (
                <th
                  data-column={col.accessor}
                  id={`heading-${col.accessor.replace(/\./g, '__')}`}
                  key={col.accessor}
                  role={isGrid ? 'columnheader' : undefined}
                  scope="col"
                >
                  {col.Heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((row, rowIndex) => {
              const key =
                typeof row.id === 'string' || typeof row.id === 'number' ? String(row.id) : rowIndex
              const metadata = nestedDocRows?.[String(row.id)]

              return nestedDocs && metadata ? (
                <React.Fragment key={key}>
                  <NestedDocsBranchRow
                    columns={activeColumns}
                    hasCellNavigation={isGrid}
                    hasRowSelection={Boolean(hasRowSelection)}
                    isLastRendered={
                      rowIndex === data.length - 1 && !tree?.continuationsByRowID.has(String(key))
                    }
                    row={row}
                    rowIndex={rowIndex}
                    rowMetadata={metadata}
                    useAsTitle={useAsTitle}
                  />
                  {(tree?.continuationsByRowID.get(String(key)) ?? []).map((parentID) => {
                    const parent =
                      parentID === null
                        ? undefined
                        : tree?.docs.find((doc) => String(doc.id) === String(parentID))
                    const titleValue = parent && useAsTitle ? parent[useAsTitle] : undefined
                    const label =
                      parentID === null
                        ? (ariaLabel ?? navigationLabel ?? t('general:treeLayout'))
                        : typeof titleValue === 'string' || typeof titleValue === 'number'
                          ? String(titleValue)
                          : String(parentID)

                    return (
                      <NestedDocsContinuationRow
                        columns={activeColumns}
                        hasCellNavigation={isGrid}
                        key={`load-${parentID}`}
                        label={label}
                        parentID={parentID}
                        titleColumn={
                          activeColumns.find((column) => column.isLinkedColumn)?.accessor ??
                          activeColumns.find((column) => column.accessor !== '_select')?.accessor
                        }
                      />
                    )
                  })}
                </React.Fragment>
              ) : (
                <TableRow
                  columns={activeColumns}
                  hasCellNavigation={isGrid}
                  hasRowSelection={Boolean(hasRowSelection)}
                  key={key}
                  row={row}
                  rowIndex={rowIndex}
                />
              )
            })}
          </tbody>
        </table>
      </TableGridContext>
    </div>
  )
}
