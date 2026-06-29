'use client'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { SlotColumn } from './SlotTable.js'
import type { TableRow } from './types.js'

import { Button } from '../../../elements/Button/index.js'
import { Link } from '../../../elements/Link/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { EditIcon } from '../../../icons/Edit/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
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

  const documentURL = formatAdminURL({
    adminRoute,
    path: `/collections/${row._collectionSlug}/${row.id}`,
  })

  const hierarchyURL = formatAdminURL({
    adminRoute,
    path: `/collections/${row._collectionSlug}?${parentFieldName}=${row.id}`,
  })

  const DefaultIcon = isFolder ? <FolderIcon /> : <TagIcon />

  return (
    <div className={`${baseClass}__name-cell`}>
      <Link className={`${baseClass}__name-link`} href={hierarchyURL}>
        <span className={`${baseClass}__name-icon`}>{row._hierarchyIcon || DefaultIcon}</span>
        <span className={`${baseClass}__name-label`}>
          <span className={`${baseClass}__name-text-truncated`}>{title}</span>
        </span>
        {row._hasChildren && (
          <span className={`${baseClass}__chevron`}>
            <ChevronIcon direction="right" />
          </span>
        )}
      </Link>
      <Button
        aria-label={t('general:editLabel', { label: title })}
        buttonStyle="ghost"
        className={`${baseClass}__edit-button`}
        el="link"
        icon={<EditIcon size={16} />}
        margin={false}
        size="medium"
        to={documentURL}
      />
    </div>
  )
}
