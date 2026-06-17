'use client'
import type { ClientField, SanitizedCollectionConfig } from 'payload'

import React, { useCallback } from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { GroupByControl } from '../GroupByControl/index.js'

export type ListGroupByControlProps = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly fields: ClientField[]
}

/**
 * Connects the presentational {@link GroupByControl} to the list query state, so the
 * control itself stays unaware of where its value is stored.
 */
export const ListGroupByControl: React.FC<ListGroupByControlProps> = ({
  collectionSlug,
  fields,
}) => {
  const { query, refineListData } = useListQuery()

  const handleChange = useCallback(
    (groupBy: string) => {
      void refineListData({ groupBy, page: 1 })
    },
    [refineListData],
  )

  return (
    <GroupByControl
      collectionSlug={collectionSlug}
      fields={fields}
      onChange={handleChange}
      value={query?.groupBy ?? ''}
    />
  )
}
