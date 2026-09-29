'use client'

import { formatAdminURL } from 'payload/shared'
import React, { useCallback } from 'react'

import type { SlotColumn } from './SlotTable.js'
import type { TableRow } from './types.js'

import { useDocumentDrawer } from '../../../elements/DocumentDrawer/index.js'
import { Link } from '../../../elements/Link/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { EditIcon } from '../../../icons/Edit/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { baseClass } from './types.js'

export const ChildNameCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
  const { t } = useTranslation()
  const { refreshTree } = useHierarchy()
  const { clearRouteCache } = useRouteCache()

  const collectionConfig = getEntityConfig({ collectionSlug: row._collectionSlug })
  const titleField = collectionConfig?.admin?.useAsTitle || 'id'
  const rawTitle =
    typeof row[titleField] === 'string' || typeof row[titleField] === 'number'
      ? row[titleField]
      : row.id
  const title = typeof rawTitle === 'object' ? JSON.stringify(rawTitle) : String(rawTitle)
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const isFolder = Boolean(hierarchyConfig && hierarchyConfig.allowHasMany === false)
  const parentFieldName = hierarchyConfig?.parentFieldName || 'parent'

  // `_browseHref` keeps the click inside the collection being browsed; the fallback covers rows
  // built outside the hierarchy view.
  const hierarchyURL =
    row._browseHref ??
    formatAdminURL({
      adminRoute,
      path: `/collections/${row._collectionSlug}?${parentFieldName}=${row.id}`,
    })

  const DefaultIcon = isFolder ? <FolderIcon /> : <TagIcon />

  const [DocumentDrawer, , { openDrawer }] = useDocumentDrawer({
    id: row.id,
    collectionSlug: row._collectionSlug,
  })

  // Editing happens in place, so the table and tree are refreshed rather than navigated away from.
  const handleSave = useCallback(() => {
    clearRouteCache()
    refreshTree(row._collectionSlug)
  }, [clearRouteCache, refreshTree, row._collectionSlug])

  return (
    <div className={`${baseClass}__name-cell`}>
      <Link className={`${baseClass}__name-link cell-link`} href={hierarchyURL}>
        <span className={`${baseClass}__name-icon`}>{row._hierarchyIcon || DefaultIcon}</span>
        <span className={`${baseClass}__name-text`}>{title}</span>
        {row._hasChildren && (
          <span className={`${baseClass}__chevron`}>
            <ChevronIcon direction="right" />
          </span>
        )}
      </Link>
      <button
        aria-label={t('general:editLabel', { label: title })}
        className={`${baseClass}__edit-button`}
        onClick={openDrawer}
        type="button"
      >
        <EditIcon />
      </button>
      <DocumentDrawer onSave={handleSave} />
    </div>
  )
}
