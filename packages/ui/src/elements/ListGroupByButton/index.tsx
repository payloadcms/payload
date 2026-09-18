'use client'
import type { ClientField, SanitizedCollectionConfig } from 'payload'

import React, { useCallback } from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { GroupByButton } from '../GroupBy/index.js'

export type ListGroupByButtonProps = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly fields: ClientField[]
}

/**
 * Connects the presentational {@link GroupByButton} to the list query state, so the
 * control itself stays unaware of where its value is stored.
 */
export const ListGroupByButton: React.FC<ListGroupByButtonProps> = ({ collectionSlug, fields }) => {
  const { query, refineListData } = useListQuery()

  const handleChange = useCallback(
    (groupBy: string) => {
      void refineListData({ groupBy, page: 1 })
    },
    [refineListData],
  )

  return (
    <GroupByButton
      collectionSlug={collectionSlug}
      fields={fields}
      onChange={handleChange}
      value={query?.groupBy ?? ''}
    />
  )
}
