'use client'

import { useRouter } from 'next/navigation.js'
import { DEFAULT_HIERARCHY_TREE_LIMIT, formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useState } from 'react'

import type {
  AllowedCollection,
  HierarchyContextValue,
  HierarchyDocument,
  HierarchyHydrateData,
  HierarchyProviderProps,
  HierarchyTreeCacheEntry,
} from './types.js'

import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js'
import { useConfig } from '../Config/index.js'
import { usePreferences } from '../Preferences/index.js'

const HierarchyContext = createContext<HierarchyContextValue | undefined>(undefined)

export const HierarchyProvider: React.FC<HierarchyProviderProps> = ({ children }) => {
  const { setPreference } = usePreferences()
  const router = useRouter()
  const {
    config: {
      routes: { admin: adminRoute, api },
      serverURL,
    },
  } = useConfig()

  const [collectionSlug, setCollectionSlug] = useState<null | string>(null)
  const [viewCollectionSlug, setViewCollectionSlug] = useState<null | string>(null)
  const [parent, setParent] = useState<null | Record<string, unknown>>(null)
  const [parentFieldName, setParentFieldName] = useState<string>('')
  const [treeLimit, setTreeLimit] = useState<number>(DEFAULT_HIERARCHY_TREE_LIMIT)
  const [typeFieldName, setTypeFieldName] = useState<null | string>(null)
  const [useAsTitle, setUseAsTitle] = useState<null | string>(null)
  const [allowedCollections, setAllowedCollections] = useState<AllowedCollection[] | null>(null)

  const [treeCache, setTreeCache] = useState<Map<string, HierarchyTreeCacheEntry>>(() => new Map())
  const [expandedNodesByCollection, setExpandedNodesByCollection] = useState<
    Map<string, Set<number | string>>
  >(() => new Map())
  const [selectedFiltersByCollection, setSelectedFiltersByCollection] = useState<
    Map<string, string[]>
  >(() => new Map())
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [loadingNodeId, setLoadingNodeId] = useState<null | number | string>(null)
  const [treeRefreshKey, setTreeRefreshKey] = useState<number>(0)

  const getNodeChildren = useCallback(
    (parentId: null | number | string): HierarchyDocument[] => {
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

  const hydrate = useCallback((data: HierarchyHydrateData) => {
    const {
      allowedCollections: newAllowedCollections,
      collectionSlug: slug,
      expandedNodes: newExpandedNodes,
      parent: newParent,
      parentFieldName: newParentFieldName,
      selectedFilters: newSelectedFilters,
      treeData,
      treeLimit: newTreeLimit,
      typeFieldName: newTypeFieldName,
      useAsTitle: newUseAsTitle,
      viewCollectionSlug: newViewCollectionSlug,
    } = data

    setCollectionSlug(slug)

    if (newViewCollectionSlug) {
      setViewCollectionSlug(newViewCollectionSlug)
    }

    if (newAllowedCollections) {
      setAllowedCollections(newAllowedCollections)
    }

    if (newParentFieldName) {
      setParentFieldName(newParentFieldName)
    }

    if (newTreeLimit !== undefined) {
      setTreeLimit(newTreeLimit)
    }

    if (newTypeFieldName !== undefined) {
      setTypeFieldName(newTypeFieldName)
    }

    if (newParent !== undefined) {
      setParent(newParent)
    }

    if (newUseAsTitle !== undefined) {
      setUseAsTitle(newUseAsTitle)
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

    if (newSelectedFilters) {
      setSelectedFiltersByCollection((prev) => {
        const newMap = new Map(prev)
        newMap.set(slug, newSelectedFilters)
        return newMap
      })
    }
  }, [])

  const savePreferencesDebounced = useDebouncedCallback(
    async (slug: string, data: { expanded?: Set<number | string>; filters?: string[] }) => {
      const preferenceKey = `${PREFERENCE_KEYS.HIERARCHY_TREE}-${slug}`
      const currentExpanded = expandedNodesByCollection.get(slug) || new Set()
      const currentFilters = selectedFiltersByCollection.get(slug) || []

      await setPreference(preferenceKey, {
        expandedNodes: Array.from(data.expanded ?? currentExpanded),
        selectedFilters: data.filters ?? currentFilters,
      })
    },
    500,
  )

  const toggleNodeForCollection = useCallback(
    (slug: string, id: number | string) => {
      setExpandedNodesByCollection((prev) => {
        const newMap = new Map(prev)
        const currentExpanded = newMap.get(slug) || new Set()
        const newExpanded = new Set(currentExpanded)

        if (newExpanded.has(id)) {
          newExpanded.delete(id)
        } else {
          newExpanded.add(id)
        }

        newMap.set(slug, newExpanded)
        savePreferencesDebounced(slug, { expanded: newExpanded })
        return newMap
      })
    },
    [savePreferencesDebounced],
  )

  const toggleNode = useCallback(
    (id: number | string) => {
      if (!collectionSlug) {
        return
      }
      toggleNodeForCollection(collectionSlug, id)
    },
    [collectionSlug, toggleNodeForCollection],
  )

  const getExpandedNodesForCollection = useCallback(
    (slug: string): Set<number | string> => {
      return expandedNodesByCollection.get(slug) || new Set()
    },
    [expandedNodesByCollection],
  )

  const setSelectedFilters = useCallback(
    (filters: string[]) => {
      if (!collectionSlug) {
        return
      }

      setSelectedFiltersByCollection((prev) => {
        const newMap = new Map(prev)
        newMap.set(collectionSlug, filters)
        savePreferencesDebounced(collectionSlug, { filters })
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
          { limit: treeLimit, page: nextPage, sort: useAsTitle ?? 'id', where },
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
    [
      api,
      collectionSlug,
      isLoadingMore,
      parentFieldName,
      serverURL,
      treeCache,
      treeLimit,
      useAsTitle,
    ],
  )

  const reset = useCallback(() => {
    setCollectionSlug(null)
    setViewCollectionSlug(null)
    setParent(null)
    setParentFieldName('')
    setTreeLimit(DEFAULT_HIERARCHY_TREE_LIMIT)
    setTypeFieldName(null)
    setUseAsTitle(null)
    setTreeCache(new Map())
    setExpandedNodesByCollection(new Map())
    setSelectedFiltersByCollection(new Map())
    setIsLoadingMore(false)
    setLoadingNodeId(null)
  }, [])

  const refreshTree = useCallback(() => {
    setTreeCache(new Map())
    setTreeRefreshKey((prev) => prev + 1)
  }, [])

  const expandedNodes =
    collectionSlug && expandedNodesByCollection.has(collectionSlug)
      ? expandedNodesByCollection.get(collectionSlug)
      : new Set<number | string>()

  const selectedFilters =
    collectionSlug && selectedFiltersByCollection.has(collectionSlug)
      ? selectedFiltersByCollection.get(collectionSlug)
      : []

  const value: HierarchyContextValue = {
    allowedCollections,
    collectionSlug,
    expandedNodes,
    getExpandedNodesForCollection,
    getNodeChildren,
    hydrate,
    isLoadingMore,
    loadingNodeId,
    loadMoreChildren,
    parent,
    parentFieldName,
    refreshTree,
    reset,
    selectedFilters,
    selectParent,
    setSelectedFilters,
    toggleNode,
    toggleNodeForCollection,
    treeLimit,
    treeRefreshKey,
    typeFieldName,
    useAsTitle,
    viewCollectionSlug,
  }

  return <HierarchyContext value={value}>{children}</HierarchyContext>
}

export const useHierarchy = (): HierarchyContextValue => {
  const context = use(HierarchyContext)
  if (!context) {
    throw new Error('useHierarchy must be used within HierarchyProvider')
  }
  return context
}
