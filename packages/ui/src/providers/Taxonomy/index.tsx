'use client'

import { useRouter } from 'next/navigation.js'
import { DEFAULT_TAXONOMY_TREE_LIMIT } from 'payload'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useState } from 'react'

import type {
  HydrateData,
  TaxonomyContextValue,
  TaxonomyDocument,
  TaxonomyProviderProps,
  TreeCacheEntry,
} from './types.js'

import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js'
import { useConfig } from '../Config/index.js'
import { usePreferences } from '../Preferences/index.js'

const TaxonomyContext = createContext<TaxonomyContextValue | undefined>(undefined)

export const TaxonomyProvider: React.FC<TaxonomyProviderProps> = ({ children }) => {
  const { setPreference } = usePreferences()
  const router = useRouter()
  const {
    config: {
      routes: { admin: adminRoute, api },
      serverURL,
    },
  } = useConfig()

  const [collectionSlug, setCollectionSlug] = useState<null | string>(null)
  const [selectedParentId, setSelectedParentId] = useState<null | number | string>(null)
  const [parentFieldName, setParentFieldName] = useState<string>('parent')
  const [treeLimit, setTreeLimit] = useState<number>(DEFAULT_TAXONOMY_TREE_LIMIT)

  const [treeCache, setTreeCache] = useState<Map<string, TreeCacheEntry>>(() => new Map())
  const [expandedNodesByCollection, setExpandedNodesByCollection] = useState<
    Map<string, Set<number | string>>
  >(() => new Map())
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [loadingNodeId, setLoadingNodeId] = useState<null | number | string>(null)

  const getNodeChildren = useCallback(
    (parentId: null | number | string): TaxonomyDocument[] => {
      if (!collectionSlug) {
        return []
      }

      const cache = treeCache.get(collectionSlug)
      if (!cache) {
        return []
      }

      return cache.docs.filter((doc) => {
        const docParentId = doc[parentFieldName]
        if (parentId === null) {
          return docParentId === null || docParentId === undefined
        }
        return docParentId !== null && String(docParentId) === String(parentId)
      })
    },
    [collectionSlug, parentFieldName, treeCache],
  )

  const hydrate = useCallback((data: HydrateData) => {
    const {
      collectionSlug: slug,
      expandedNodes: newExpandedNodes,
      parentFieldName: newParentFieldName,
      selectedParentId: newSelectedParentId,
      treeData,
      treeLimit: newTreeLimit,
    } = data

    setCollectionSlug(slug)

    if (newParentFieldName) {
      setParentFieldName(newParentFieldName)
    }

    if (newTreeLimit !== undefined) {
      setTreeLimit(newTreeLimit)
    }

    if (newSelectedParentId !== undefined) {
      setSelectedParentId(newSelectedParentId)
    }

    if (treeData) {
      setTreeCache((prev) => {
        const newCache = new Map(prev)
        const existingEntry = newCache.get(slug)

        if (existingEntry) {
          const existingDocIds = new Set(existingEntry.docs.map((doc) => doc.id))
          const newDocs = treeData.docs.filter((doc) => !existingDocIds.has(doc.id))

          newCache.set(slug, {
            docs: [...existingEntry.docs, ...newDocs],
            loadedParents: {
              ...existingEntry.loadedParents,
              ...treeData.loadedParents,
            },
          })
        } else {
          newCache.set(slug, treeData)
        }

        return newCache
      })
    }

    if (newExpandedNodes && newExpandedNodes.length > 0) {
      setExpandedNodesByCollection((prev) => {
        const newMap = new Map(prev)
        const existingExpanded = newMap.get(slug) || new Set()
        const mergedExpanded = new Set([...existingExpanded, ...newExpandedNodes])
        newMap.set(slug, mergedExpanded)
        return newMap
      })
    }
  }, [])

  const savePreferencesDebounced = useDebouncedCallback(
    async (slug: string, expanded: Set<number | string>) => {
      const preferenceKey = `${PREFERENCE_KEYS.TAXONOMY_TREE}-${slug}`
      await setPreference(preferenceKey, { expandedNodes: Array.from(expanded) })
    },
    500,
  )

  const toggleNode = useCallback(
    (id: number | string) => {
      if (!collectionSlug) {
        return
      }

      setExpandedNodesByCollection((prev) => {
        const newMap = new Map(prev)
        const currentExpanded = newMap.get(collectionSlug) || new Set()
        const newExpanded = new Set(currentExpanded)

        if (newExpanded.has(id)) {
          newExpanded.delete(id)
        } else {
          newExpanded.add(id)
        }

        newMap.set(collectionSlug, newExpanded)
        savePreferencesDebounced(collectionSlug, newExpanded)
        return newMap
      })
    },
    [collectionSlug, savePreferencesDebounced],
  )

  const selectParent = useCallback(
    (id: null | number | string) => {
      if (!collectionSlug) {
        return
      }

      setSelectedParentId(id)

      const url = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}${id !== null ? `?parent=${id}` : ''}`,
      })
      router.push(url)
      router.refresh()
    },
    [adminRoute, collectionSlug, router],
  )

  const loadMoreChildren = useCallback(
    async (parentId: null | number | string): Promise<void> => {
      if (!collectionSlug || isLoadingMore) {
        return
      }

      const cache = treeCache.get(collectionSlug)
      if (!cache) {
        return
      }

      const parentKey = parentId === null ? 'root' : String(parentId)
      const parentMeta = cache.loadedParents[parentKey]
      if (!parentMeta || !parentMeta.hasMore) {
        return
      }

      setIsLoadingMore(true)
      setLoadingNodeId(parentId)

      try {
        const currentChildren = cache.docs.filter((doc) => {
          const docParentId = doc[parentFieldName]
          if (parentId === null) {
            return docParentId === null || docParentId === undefined
          }
          return docParentId !== null && String(docParentId) === String(parentId)
        })

        const nextPage = Math.floor(currentChildren.length / treeLimit) + 1

        const where =
          parentId === null
            ? {
                or: [
                  { [parentFieldName]: { exists: false } },
                  { [parentFieldName]: { equals: null } },
                ],
              }
            : { [parentFieldName]: { equals: parentId } }

        const queryString = qs.stringify(
          { limit: treeLimit, page: nextPage, where },
          { addQueryPrefix: true },
        )
        const url = formatAdminURL({
          apiRoute: api,
          path: `/${collectionSlug}${queryString}`,
          serverURL,
        })
        const response = await fetch(url, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch more children')
        }

        const data = await response.json()
        const newDocs = data.docs || []

        setTreeCache((prev) => {
          const newCache = new Map(prev)
          const existingEntry = newCache.get(collectionSlug)

          if (existingEntry) {
            const existingDocIds = new Set(existingEntry.docs.map((doc) => doc.id))
            const uniqueNewDocs = newDocs.filter((doc) => !existingDocIds.has(doc.id))

            newCache.set(collectionSlug, {
              docs: [...existingEntry.docs, ...uniqueNewDocs],
              loadedParents: {
                ...existingEntry.loadedParents,
                [parentKey]: {
                  hasMore: data.hasNextPage || false,
                  totalDocs: data.totalDocs || 0,
                },
              },
            })
          }

          return newCache
        })
      } catch {
        // Failed to load more children - silently fail
      } finally {
        setIsLoadingMore(false)
        setLoadingNodeId(null)
      }
    },
    [api, collectionSlug, isLoadingMore, parentFieldName, serverURL, treeCache, treeLimit],
  )

  const reset = useCallback(() => {
    setCollectionSlug(null)
    setSelectedParentId(null)
    setParentFieldName('parent')
    setTreeLimit(DEFAULT_TAXONOMY_TREE_LIMIT)
    setTreeCache(new Map())
    setExpandedNodesByCollection(new Map())
    setIsLoadingMore(false)
    setLoadingNodeId(null)
  }, [])

  const expandedNodes =
    collectionSlug && expandedNodesByCollection.has(collectionSlug)
      ? expandedNodesByCollection.get(collectionSlug)
      : new Set<number | string>()

  const value: TaxonomyContextValue = {
    collectionSlug,
    expandedNodes,
    getNodeChildren,
    hydrate,
    isLoadingMore,
    loadingNodeId,
    loadMoreChildren,
    parentFieldName,
    reset,
    selectedParentId,
    selectParent,
    toggleNode,
    treeLimit,
  }

  return <TaxonomyContext value={value}>{children}</TaxonomyContext>
}

export const useTaxonomy = (): TaxonomyContextValue => {
  const context = use(TaxonomyContext)
  if (!context) {
    throw new Error('useTaxonomy must be used within TaxonomyProvider')
  }
  return context
}
