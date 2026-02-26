'use client'

import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import { useCallback, useState } from 'react'

import type { SearchResult } from './types.js'

import { useConfig } from '../../providers/Config/index.js'

type UseHierarchySearchArgs = {
  collectionSlug: string
  limit?: number
  parentFieldName?: string
  titleField: string
  titlePathField?: string
}

type UseHierarchySearchReturn = {
  clearResults: () => void
  hasNextPage: boolean
  isLoading: boolean
  loadMore: () => Promise<void>
  results: SearchResult[]
  search: (query: string) => Promise<void>
  totalDocs: number
}

export const useHierarchySearch = ({
  collectionSlug,
  limit = 15,
  parentFieldName = 'parent',
  titleField,
  titlePathField = '_h_titlePath',
}: UseHierarchySearchArgs): UseHierarchySearchReturn => {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalDocs, setTotalDocs] = useState(0)
  const [page, setPage] = useState(1)
  const [currentQuery, setCurrentQuery] = useState('')

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const fetchResults = useCallback(
    async (query: string, pageToFetch: number, append: boolean) => {
      setIsLoading(true)

      try {
        const queryString = qs.stringify(
          {
            computeHierarchyPaths: true,
            limit,
            page: pageToFetch,
            select: {
              [parentFieldName]: true,
              [titleField]: true,
              [titlePathField]: true,
            },
            where: {
              [titleField]: { contains: query },
            },
          },
          { addQueryPrefix: true },
        )

        const url = formatAdminURL({
          apiRoute: api,
          path: `/${collectionSlug}${queryString}`,
          serverURL,
        })

        const response = await fetch(url, { credentials: 'include' })

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        const docs: SearchResult[] = (data.docs || []).map((doc: Record<string, unknown>) => ({
          ...doc,
          path: doc[titlePathField] || '',
        }))

        setResults(append ? (prev) => [...prev, ...docs] : docs)
        setHasNextPage(data.hasNextPage || false)
        setTotalDocs(data.totalDocs || 0)
        setPage(pageToFetch)
        setCurrentQuery(query)
      } catch {
        if (!append) {
          setResults([])
          setHasNextPage(false)
          setTotalDocs(0)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [api, collectionSlug, limit, parentFieldName, serverURL, titleField, titlePathField],
  )

  const search = useCallback(
    async (query: string) => {
      await fetchResults(query, 1, false)
    },
    [fetchResults],
  )

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNextPage || !currentQuery) {
      return
    }

    await fetchResults(currentQuery, page + 1, true)
  }, [isLoading, hasNextPage, currentQuery, page, fetchResults])

  const clearResults = useCallback(() => {
    setResults([])
    setHasNextPage(false)
    setTotalDocs(0)
    setPage(1)
    setCurrentQuery('')
  }, [])

  return {
    clearResults,
    hasNextPage,
    isLoading,
    loadMore,
    results,
    search,
    totalDocs,
  }
}
