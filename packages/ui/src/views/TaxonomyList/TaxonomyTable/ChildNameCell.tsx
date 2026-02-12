'use client'

import React from 'react'

import type { SlotColumn } from './SlotTable.js'
import type { TableRow } from './types.js'

import { Locked } from '../../../elements/Locked/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useTaxonomy } from '../../../providers/Taxonomy/index.js'
import { baseClass } from './types.js'

export const ChildNameCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const { getEntityConfig } = useConfig()
  const { isLocked } = useDocumentSelection()
  const { selectParent } = useTaxonomy()

  const config = getEntityConfig({ collectionSlug: row._collectionSlug })
  const titleField = config?.admin?.useAsTitle || 'id'
  const rawTitle = row[titleField] || row.id
  const title = typeof rawTitle === 'object' ? JSON.stringify(rawTitle) : String(rawTitle)

  const locked = isLocked({ id: row.id, collectionSlug: row._collectionSlug })

  if (locked && row._userEditing) {
    return (
      <span className={`${baseClass}__name-link ${baseClass}__name-link--locked`}>
        <Locked user={row._userEditing} />
        <span className={`${baseClass}__name-text`}>{title}</span>
      </span>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    selectParent(row.id)
  }

  return (
    <button className={`${baseClass}__name-link`} onClick={handleClick} type="button">
      <TagIcon />
      <span className={`${baseClass}__name-text`}>{title}</span>
      {row._hasChildren && (
        <span className={`${baseClass}__chevron`}>
          <ChevronIcon direction="right" />
        </span>
      )}
    </button>
  )
}
