'use client'

import type { SanitizedCollectionConfig } from 'payload'

import React from 'react'

import { useTableColumns } from '../../providers/TableColumns/index.js'
import { ColumnsButton } from '../ColumnsButton/index.js'

export type ListColumnsButtonProps = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
}

/**
 * Connects the presentational {@link ColumnsButton} to the table columns state, so the
 * button itself stays unaware of where its column state is stored.
 */
export const ListColumnsButton: React.FC<ListColumnsButtonProps> = ({ collectionSlug }) => {
  const { columns, setColumns } = useTableColumns()

  return <ColumnsButton collectionSlug={collectionSlug} columns={columns} onChange={setColumns} />
}
