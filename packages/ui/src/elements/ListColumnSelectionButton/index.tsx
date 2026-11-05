'use client'

import type { SanitizedCollectionConfig } from 'payload'

import React from 'react'

import { useTableColumns } from '../../providers/TableColumns/index.js'
import { ColumnSelectionButton } from '../ColumnSelection/index.js'

export type ListColumnSelectionButtonProps = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
}

/**
 * Connects the presentational {@link ColumnSelectionButton} to the table columns state, so the
 * button itself stays unaware of where its column state is stored.
 */
export const ListColumnSelectionButton: React.FC<ListColumnSelectionButtonProps> = ({
  collectionSlug,
}) => {
  const { columns, setColumns } = useTableColumns()

  return (
    <ColumnSelectionButton
      collectionSlug={collectionSlug}
      columns={columns}
      onChange={setColumns}
    />
  )
}
