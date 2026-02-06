'use client'

import { PREFERENCE_KEYS } from 'payload/shared'
import React, { createContext, use, useCallback, useRef, useState } from 'react'

import type {
  HydrateData,
  TaxonomyContextValue,
  TaxonomyDocument,
  TaxonomyProviderProps,
  TreeCacheEntry,
} from './types.js'

import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js'
import { usePreferences } from '../Preferences/index.js'

const TaxonomyContext = createContext<TaxonomyContextValue | undefined>(undefined)

export const TaxonomyProvider: React.FC<TaxonomyProviderProps> = ({ children }) => {
  const { setPreference } = usePreferences()

  const [collectionSlug, setCollectionSlug] = useState<null | string>(null)
  const [selectedParentId, setSelectedParentId] = useState<null | number | string>(null)
  const [parentFieldName, setParentFieldName] = useState<string>('parent')
  const [treeLimit, setTreeLimit] = useState<number>(100)

  const [treeCache, setTreeCache] = useState<Map<string, TreeCacheEntry>>(new Map())
  const [expandedNodesByCollection, setExpandedNodesByCollection] = useState<
    Map<string, Set<number | string>>
  >(new Map())
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [loadingNodeId, setLoadingNodeId] = useState<null | number | string>(null)

  const getNodeChildren = (parentId: null | number | string): TaxonomyDocument[] => {
    if (!collectionSlug) {
      return []
    }

    const cache = treeCache.get(collectionSlug)
    if (!cache) {
      return []
    }

    const parentKey = parentId === null ? 'root' : String(parentId)
    return cache.docs.filter((doc) => {
      const docParentId = doc[parentFieldName]
      if (parentId === null) {
        return docParentId === null || docParentId === undefined
      }
      return String(docParentId) === String(parentId)
    })
  }

  const hydrate = (data: HydrateData) => {
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
  }

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

  const selectParent = (id: null | number | string) => {
    // Placeholder - will implement later
  }

  const loadMoreChildren = async (parentId: null | number | string): Promise<void> => {
    // Placeholder - will implement later
  }

  const reset = () => {
    // Placeholder - will implement later
  }

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
