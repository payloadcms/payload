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
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [loadingNodeId, setLoadingNodeId] = useState<null | number | string>(null)

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
      treeData,
      treeLimit: newTreeLimit,
      typeFieldName: newTypeFieldName,
      useAsTitle: newUseAsTitle,
    } = data

    setCollectionSlug(slug)

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
  }, [])

  const savePreferencesDebounced = useDebouncedCallback(
    async (slug: string, expanded: Set<number | string>) => {
      const preferenceKey = `${PREFERENCE_KEYS.HIERARCHY_TREE}-${slug}`
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
    setParent(null)
    setParentFieldName('')
    setTreeLimit(DEFAULT_HIERARCHY_TREE_LIMIT)
    setTypeFieldName(null)
    setUseAsTitle(null)
    setTreeCache(new Map())
    setExpandedNodesByCollection(new Map())
    setIsLoadingMore(false)
    setLoadingNodeId(null)
  }, [])

  const expandedNodes =
    collectionSlug && expandedNodesByCollection.has(collectionSlug)
      ? expandedNodesByCollection.get(collectionSlug)
      : new Set<number | string>()

  const value: HierarchyContextValue = {
    allowedCollections,
    collectionSlug,
    expandedNodes,
    getNodeChildren,
    hydrate,
    isLoadingMore,
    loadingNodeId,
    loadMoreChildren,
    parent,
    parentFieldName,
    reset,
    selectParent,
    toggleNode,
    treeLimit,
    typeFieldName,
    useAsTitle,
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
