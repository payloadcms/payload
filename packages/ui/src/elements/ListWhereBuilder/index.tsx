'use client'
import type { ClientField, ResolvedFilterOptions, SanitizedCollectionConfig } from 'payload'

import React, { useCallback } from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { WhereBuilder } from '../WhereBuilder/index.js'

export type ListWhereBuilderProps = {
  readonly collectionPluralLabel?: SanitizedCollectionConfig['labels']['plural']
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly fields: ClientField[]
  readonly onEmpty?: () => void
  readonly renderedFilters?: Map<string, React.ReactNode>
  readonly resolvedFilterOptions?: Map<string, ResolvedFilterOptions>
}

/**
 * Wires {@link WhereBuilder} to the list view's query state, reading the current `where`
 * from {@link useListQuery} and persisting edits back to the URL.
 */
export const ListWhereBuilder: React.FC<ListWhereBuilderProps> = ({
  collectionPluralLabel,
  collectionSlug,
  fields,
  onEmpty,
  renderedFilters,
  resolvedFilterOptions,
}) => {
  const { handleWhereChange, query } = useListQuery()

  const handleChange = useCallback(
    (where: Parameters<typeof handleWhereChange>[0]) => handleWhereChange(where),
    [handleWhereChange],
  )

  return (
    <WhereBuilder
      collectionPluralLabel={collectionPluralLabel}
      collectionSlug={collectionSlug}
      fields={fields}
      onChange={handleChange}
      onEmpty={onEmpty}
      renderedFilters={renderedFilters}
      resolvedFilterOptions={resolvedFilterOptions}
      value={query?.where}
    />
  )
}
