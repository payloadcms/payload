/**
 * Relationship field utilities for batching and caching
 *
 * These utilities help prevent N+1 query problems when loading
 * relationship fields in array/repeatable field contexts.
 */

import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import type { RelationshipBatcher } from '../../utilities/RelationshipBatcher.js'

/**
 * Configuration for building a list of relationships to fetch
 */
interface BuildRelationshipsToFetchConfig {
  relationMap: Record<string, (string | number)[]>
  getEntityConfig: (args: { collectionSlug: string }) =>
    | ClientCollectionConfig
    | ClientGlobalConfig
    | undefined
  options: Array<{ options?: Array<{ value: string | number; relationTo?: string }> }>
  batcher: RelationshipBatcher
}

/**
 * Relationship item to fetch
 */
export interface RelationshipToFetch {
  collection: ClientCollectionConfig | ClientGlobalConfig
  id: string
  fieldToSelect: string
}

/**
 * Build a list of relationships that need to be fetched
 *
 * Filters out:
 * - Relationships already loaded in component state (options)
 * - Relationships already cached in the batcher
 *
 * @param config - Configuration object
 * @returns Array of relationships to fetch
 */
export function buildRelationshipsToFetch({
  relationMap,
  getEntityConfig,
  options,
  batcher,
}: BuildRelationshipsToFetchConfig): RelationshipToFetch[] {
  const relationshipsToFetch: RelationshipToFetch[] = []

  Object.entries(relationMap).forEach(([relation, ids]) => {
    const collection = getEntityConfig({ collectionSlug: relation })
    const fieldToSelect =
      (collection?.admin as { useAsTitle?: string })?.useAsTitle || 'id'

    ids.forEach((id) => {
      // Check if already in options (cached in component state)
      const alreadyLoaded = options.some((optionGroup) =>
        optionGroup?.options?.some(
          (option) => option.value === id && option.relationTo === relation,
        ),
      )

      // Check if in batcher cache
      const cachedInBatcher = batcher.getFromCache(relation, String(id)) !== null

      if (!alreadyLoaded && !cachedInBatcher) {
        relationshipsToFetch.push({
          collection,
          id: String(id),
          fieldToSelect,
        })
      }
    })
  })

  return relationshipsToFetch
}

/**
 * Configuration for dispatching fetched documents
 */
interface DispatchFetchedDocsConfig {
  relationshipsToFetch: RelationshipToFetch[]
  apiRoute: string
  locale: string
  i18nLanguage: string
  dispatchOptions: (action: {
    type: 'ADD'
    collection: ClientCollectionConfig
    config: any
    docs: any[]
    i18n: any
    ids: string[]
    sort: boolean
  }) => void
  config: any
  i18n: any
}

/**
 * Fetch and dispatch relationship documents to component state
 *
 * @param config - Configuration object
 */
export async function dispatchFetchedDocs({
  relationshipsToFetch,
  apiRoute,
  locale,
  i18nLanguage,
  dispatchOptions,
  config,
  i18n,
}: DispatchFetchedDocsConfig): Promise<void> {
  const { formatAdminURL } = await import('payload/shared')
  const qs = await import('qs-esm')

  await Promise.all(
    relationshipsToFetch.map(async ({ collection, id }) => {
      if (!collection) return

      const fieldToSelect =
        (collection.admin as { useAsTitle?: string })?.useAsTitle || 'id'
      const query = {
        depth: 0,
        draft: true,
        limit: 1,
        locale,
        select: {
          [fieldToSelect]: true,
        },
        where: {
          id: {
            in: [id],
          },
        },
      }

      const response = await fetch(
        formatAdminURL({
          apiRoute,
          path: `/${collection.slug}`,
        }),
        {
          body: qs.stringify(query),
          credentials: 'include',
          headers: {
            'Accept-Language': i18nLanguage,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Payload-HTTP-Method-Override': 'GET',
          },
          method: 'POST',
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.docs && data.docs.length > 0) {
          dispatchOptions({
            type: 'ADD',
            collection: collection as ClientCollectionConfig,
            config,
            docs: data.docs,
            i18n,
            ids: [id],
            sort: true,
          })
        }
      }
    }),
  )
}
