'use client'

import type { User } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { TableRow } from '../../HierarchyTable/types.js'

import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { DocumentCard } from '../DocumentCard/index.js'
import { FolderCard } from '../FolderCard/index.js'

export type HierarchyCardProps = {
  dropState?: 'invalid' | 'over'
  href: string
  isHierarchyGroup: boolean
  isSelected?: boolean
  lockedUser?: User
  row: TableRow
  showTypePill?: boolean
  title: string
}

/**
 * Picks the card that suits a row and supplies its labels. Extracted so the drag overlay can render
 * the very cards being dragged rather than an approximation of them.
 */
export const HierarchyCard: React.FC<HierarchyCardProps> = ({
  dropState,
  href,
  isHierarchyGroup,
  isSelected = false,
  lockedUser,
  row,
  showTypePill = false,
  title,
}) => {
  const { getEntityConfig } = useConfig()
  const { i18n } = useTranslation()

  const collectionConfig = getEntityConfig({ collectionSlug: row._collectionSlug })

  if (isHierarchyGroup) {
    return (
      <FolderCard
        dropState={dropState}
        hasChildren={Boolean(row._hasChildren)}
        href={href}
        icon={row._hierarchyIcon}
        isSelected={isSelected}
        lockedUser={lockedUser}
        title={title}
      />
    )
  }

  return (
    <DocumentCard
      collectionSlug={row._collectionSlug}
      doc={row}
      href={href}
      isSelected={isSelected}
      lockedUser={lockedUser}
      showType={showTypePill}
      // The pill labels a single document, so the singular label reads correctly ("Media");
      // _collectionLabel is the plural used for the table column heading.
      typeLabel={getTranslation(collectionConfig?.labels?.singular, i18n) || row._collectionLabel}
      updatedAt={typeof row.updatedAt === 'string' ? row.updatedAt : undefined}
    />
  )
}
