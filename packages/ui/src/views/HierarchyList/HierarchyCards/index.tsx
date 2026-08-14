'use client'

import type { User } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { TableRow } from '../HierarchyTable/types.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { DocumentCard } from './DocumentCard/index.js'
import { FolderCard } from './FolderCard/index.js'
import './index.css'

const baseClass = 'hierarchy-card-grid'

const getRowTitle = ({ row, useAsTitle }: { row: TableRow; useAsTitle: string }): string => {
  const rawTitle = row[useAsTitle]

  if (typeof rawTitle === 'string' || typeof rawTitle === 'number') {
    return String(rawTitle)
  }

  return String(row.id)
}

export type HierarchyCardGridProps = {
  /**
   * Accessible name for the grid, so the list is distinguishable when several groups render.
   */
  ariaLabel?: string
  /**
   * Returns the user currently editing a row, mirroring the table's lock affordance. Locked rows
   * cannot be selected, so their cards render a lock indicator instead of a checkbox.
   */
  getRowLockedUser?: (row: TableRow) => undefined | User
  /**
   * Hierarchy children render as folder cards, related documents render as document cards.
   */
  isHierarchyGroup: boolean
  onSelectionChange: (row: TableRow) => void
  rows: TableRow[]
  selectedIds: Set<number | string>
}

export function HierarchyCardGrid({
  ariaLabel,
  getRowLockedUser,
  isHierarchyGroup,
  onSelectionChange,
  rows,
  selectedIds,
}: HierarchyCardGridProps) {
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
  const { i18n } = useTranslation()

  return (
    <ul
      aria-label={ariaLabel}
      className={[baseClass, isHierarchyGroup && `${baseClass}--folders`].filter(Boolean).join(' ')}
    >
      {rows.map((row) => {
        const collectionConfig = getEntityConfig({ collectionSlug: row._collectionSlug })
        const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
        const title = getRowTitle({ row, useAsTitle })
        const isSelected = selectedIds.has(row.id)
        const key = `${row._collectionSlug}-${row.id}`
        const lockedUser = getRowLockedUser?.(row)

        // A locked row cannot be selected (the selection provider rejects it), so offering a
        // checkbox would be inert. Surface the lock instead, as the table does.
        const handleSelectionChange = lockedUser ? undefined : () => onSelectionChange(row)

        const hierarchyConfig =
          collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
            ? collectionConfig.hierarchy
            : undefined
        const parentFieldName = hierarchyConfig?.parentFieldName || 'parent'

        return (
          <li className={`${baseClass}__item`} key={key}>
            {isHierarchyGroup ? (
              <FolderCard
                hasChildren={Boolean(row._hasChildren)}
                href={formatAdminURL({
                  adminRoute,
                  path: `/collections/${row._collectionSlug}?${parentFieldName}=${row.id}`,
                })}
                icon={row._hierarchyIcon}
                isSelected={isSelected}
                lockedUser={lockedUser}
                onSelectionChange={handleSelectionChange}
                title={title}
              />
            ) : (
              <DocumentCard
                collectionSlug={row._collectionSlug}
                doc={row}
                href={formatAdminURL({
                  adminRoute,
                  path: `/collections/${row._collectionSlug}/${row.id}`,
                })}
                isSelected={isSelected}
                lockedUser={lockedUser}
                onSelectionChange={handleSelectionChange}
                showType
                // The pill labels a single document, so the singular label reads correctly
                // ("Media"); _collectionLabel is the plural used for the table column heading.
                typeLabel={
                  getTranslation(collectionConfig?.labels?.singular, i18n) || row._collectionLabel
                }
                updatedAt={typeof row.updatedAt === 'string' ? row.updatedAt : undefined}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
