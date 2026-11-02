'use client'

import type { Column, NestedDocRow, User } from 'payload'

import React, { useMemo, useRef } from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { useNestedDocs } from '../../providers/NestedDocs/index.js'
import { branchKey } from '../../providers/NestedDocs/state.js'
import { useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { useGridNavigation } from './GridNavigation/useGridNavigation.js'
import { NestedDocCell } from './NestedDocCell/index.js'
import { NestedDocsLoadMore } from './NestedDocsLoadMore/index.js'
import { TableGridContext, useTableID, useTableNavigationLabel } from './TableIdentity.js'
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
  readonly nestedDocRows?: Record<string, NestedDocRow>
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
  nestedDocRows: originalRows,
  useAsTitle,
}) => {
  const contextTree = useNestedDocs()
  const tree = originalRows ? contextTree : null
  const data = tree?.docs ?? originalData
  const nestedDocRows = tree?.rows ?? originalRows
  const columns = tree
    ? [
        ...(originalColumns?.filter((column) => column.accessor === '_select') ?? []),
        ...tree.columns,
      ]
    : originalColumns
  const { t } = useTranslation()
  const documentsByID = useMemo(
    () => (nestedDocRows ? new Map(data.map((doc) => [doc.id, doc])) : undefined),
    [data, nestedDocRows],
  )
  const tableID = useTableID(id)
  const navigationLabelFromContext = useTableNavigationLabel()
  const navigationLabel = navigationLabelFromProps ?? navigationLabelFromContext
  const tableRef = useRef<HTMLTableElement>(null)
  const isGrid = Boolean(navigationLabel)
  const { selected } = useSelection()
  const { user } = useAuth()

  const activeColumns = columns?.filter((col) => col?.active)
  const treeColumn =
    activeColumns?.find((col) => col.isLinkedColumn) ??
    activeColumns?.find((col) => col.accessor !== '_select')
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
        nestedDocRows && `${baseClass}--nested-docs`,
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
            {data &&
              data?.flatMap((row, rowIndex) => {
                const userEditing = row._userEditing as undefined | User
                const isLockedByAnotherUser =
                  row._isLocked && userEditing && userEditing.id !== user?.id
                const rowID =
                  typeof row.id === 'string' || typeof row.id === 'number' ? row.id : rowIndex
                const titleValue = useAsTitle ? row[useAsTitle] : undefined
                const rowTitle =
                  typeof titleValue === 'string' || typeof titleValue === 'number'
                    ? String(titleValue)
                    : String(rowID)
                const parentID = nestedDocRows?.[String(rowID)]?.parentID
                const parentRow =
                  parentID === null || parentID === undefined
                    ? undefined
                    : documentsByID?.get(parentID)
                const parentValue = useAsTitle ? parentRow?.[useAsTitle] : undefined
                const parentTitle = parentRow
                  ? typeof parentValue === 'string' || typeof parentValue === 'number'
                    ? String(parentValue)
                    : String(parentID)
                  : undefined

                const documentRow = (
                  <tr
                    aria-label={isGrid ? String(rowIndex + 1) : undefined}
                    aria-selected={
                      hasRowSelection && !isLockedByAnotherUser
                        ? Boolean(
                            (typeof row.id === 'string' || typeof row.id === 'number') &&
                            selected.get(row.id),
                          )
                        : undefined
                    }
                    className={`row-${rowIndex + 1}`}
                    data-id={row.id}
                    key={
                      typeof row.id === 'string' || typeof row.id === 'number'
                        ? String(row.id)
                        : rowIndex
                    }
                    role={isGrid ? 'row' : undefined}
                  >
                    {activeColumns.map((col) => {
                      const { accessor } = col

                      return (
                        <td
                          className={[
                            `cell-${accessor.replace(/\./g, '__')}`,
                            col.isLinkedColumn && 'cell--linked',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          data-column={accessor}
                          key={accessor}
                          role={isGrid ? 'gridcell' : undefined}
                        >
                          {tree && accessor === '_select' ? (
                            <SelectRow
                              rowData={{ ...row, id: rowID }}
                              rowIndex={rowIndex}
                              selectRowLabel={t('general:selectLabel', { label: rowTitle })}
                            />
                          ) : nestedDocRows?.[String(rowID)] && col === treeColumn ? (
                            <NestedDocCell
                              id={String(rowID)}
                              isLastRendered={
                                rowIndex === data.length - 1 && !tree?.sentinels.has(String(rowID))
                              }
                              parentTitle={parentTitle}
                              row={nestedDocRows[String(rowID)]}
                              title={rowTitle}
                            >
                              {col.renderedCells[rowIndex]}
                            </NestedDocCell>
                          ) : (
                            col.renderedCells[rowIndex]
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
                return [
                  documentRow,
                  ...(tree?.sentinels.get(String(rowID)) ?? []).map((parentID) => {
                    const parent =
                      parentID === null
                        ? undefined
                        : tree?.docs.find((doc) => String(doc.id) === String(parentID))
                    const value = useAsTitle ? parent?.[useAsTitle] : undefined
                    const label =
                      typeof value === 'string' || typeof value === 'number'
                        ? String(value)
                        : parentID === null
                          ? (ariaLabel ?? navigationLabel ?? t('general:treeLayout'))
                          : String(parentID)
                    return (
                      <NestedDocsLoadMore
                        columns={activeColumns}
                        isGrid={isGrid}
                        key={`load-${branchKey(parentID)}`}
                        label={label}
                        parentID={parentID}
                        titleColumn={treeColumn?.accessor}
                      />
                    )
                  }),
                ]
              })}
          </tbody>
        </table>
      </TableGridContext>
    </div>
  )
}
