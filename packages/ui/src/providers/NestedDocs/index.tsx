'use client'
import type { CollectionPreferences, Column, NestedDocRow, PaginatedDocs } from 'payload'

import * as qs from 'qs-esm'
import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { ParentID, TreeCache } from './state.js'

import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useListQuery } from '../ListQuery/index.js'
import { usePreferences } from '../Preferences/index.js'
import { usePathname, useRouter } from '../RouterAdapter/index.js'
import { useServerFunctions } from '../ServerFunctions/index.js'
import { appendTreePage, branchKey, createTreeCache, flattenTreeCache } from './state.js'

const Context = createContext<{
  columns: Column[]
  docs: PaginatedDocs['docs']
  errors: Set<string>
  loadMore: (args: { parentID: ParentID }) => Promise<void>
  pending: Set<string>
  rows: Record<string, NestedDocRow>
  sentinels: Map<string, ParentID[]>
  toggle: (args: { id: string }) => void
} | null>(null)
export const useNestedDocs = () => use(Context)

export function NestedDocsProvider({
  children,
  collectionSlug,
  columns,
  data,
  enabled,
  initialExpanded,
  rows,
}: {
  children: React.ReactNode
  collectionSlug: string
  columns: Column[]
  data: PaginatedDocs
  enabled: boolean
  initialExpanded?: string[]
  rows?: Record<string, NestedDocRow>
}) {
  const { defaultLimit, defaultSort } = useListQuery()
  const { setPreference } = usePreferences()
  const { getTableState } = useServerFunctions()
  const router = useRouter()
  const pathname = usePathname()
  const pageSize = Math.min(100, Math.max(1, Number(defaultLimit) || 10))
  const initial = useMemo(() => {
    const cache = createTreeCache({ columns, data, pageSize, rows: rows ?? {} })
    for (const id of initialExpanded ?? []) {
      cache.expanded.add(id)
    }
    return cache
  }, [columns, data, initialExpanded, rows, pageSize])
  const [local, setLocal] = useState<{ cache: TreeCache; origin: TreeCache }>()
  const cache = local?.origin === initial ? local.cache : initial
  const active = useRef({ cache, origin: initial })
  useLayoutEffect(() => {
    active.current = { cache, origin: initial }
  }, [cache, initial])
  const requests = useRef(new Map<string, { controller: AbortController; origin: TreeCache }>())
  useEffect(
    () => () => {
      for (const [key, request] of requests.current) {
        if (request.origin === initial) {
          request.controller.abort()
          requests.current.delete(key)
        }
      }
    },
    [initial],
  )

  const syncURL = useCallback(
    (next: TreeCache) => {
      const params = parseSearchParams(new URLSearchParams(window.location.search))
      params.treeExpanded = next.expanded.size > 0 ? [...next.expanded] : ''
      void setPreference<CollectionPreferences>(`collection-${collectionSlug}`, (preferences) => ({
        ...preferences,
        layoutQueries: {
          ...preferences?.layoutQueries,
          tree: { ...preferences?.layoutQueries?.tree, treeExpanded: [...next.expanded] },
        },
      }))
      const url = `${pathname}${qs.stringify(params, { addQueryPrefix: true })}`
      if (router.replaceState) {
        router.replaceState(url)
      } else {
        window.history.replaceState(window.history.state, '', url)
      }
    },
    [collectionSlug, pathname, router, setPreference],
  )
  const update = useCallback(
    (transform: (previous: TreeCache) => TreeCache) => {
      if (active.current.origin !== initial) {
        return
      }
      const next = transform(active.current.cache)
      active.current = { cache: next, origin: initial }
      setLocal({ cache: next, origin: initial })
      return next
    },
    [initial],
  )
  const loadMore = useCallback(
    async ({ parentID }: { parentID: ParentID }) => {
      if (active.current.origin !== initial) {
        return
      }
      const key = branchKey(parentID)
      const existing = requests.current.get(key)
      if (existing?.origin === initial) {
        return
      }
      existing?.controller.abort()
      const branch = active.current.cache.branches.get(key)
      if (branch && !branch.hasMore) {
        return
      }
      const controller = new AbortController()
      requests.current.set(key, { controller, origin: initial })
      update((previous) => ({
        ...previous,
        errors: new Set([...previous.errors].filter((value) => value !== key)),
        pending: new Set(previous.pending).add(key),
      }))
      const page = (branch?.page ?? 0) + 1
      try {
        const result = await getTableState({
          collectionSlug,
          columns: columns.map(({ accessor, active }) => ({ accessor, active })),
          enableRowSelections: true,
          nestedDocs: { parentID },
          orderableFieldName: '',
          query: { limit: pageSize, page, sort: defaultSort },
          signal: controller.signal,
        })
        if (
          !result?.data ||
          !result.state ||
          !('nestedDocRows' in result) ||
          !result.nestedDocRows
        ) {
          throw new Error('Invalid branch response')
        }
        const resultRows = result.nestedDocRows
        update((previous) =>
          appendTreePage({
            cache: previous,
            columns: result.state,
            data: result.data,
            page,
            parentID,
            rows: resultRows,
          }),
        )
      } catch {
        if (!controller.signal.aborted) {
          update((previous) => ({ ...previous, errors: new Set(previous.errors).add(key) }))
        }
      } finally {
        if (requests.current.get(key)?.controller === controller) {
          requests.current.delete(key)
        }
        update((previous) => ({
          ...previous,
          pending: new Set([...previous.pending].filter((value) => value !== key)),
        }))
      }
    },
    [collectionSlug, columns, getTableState, initial, pageSize, defaultSort, update],
  )
  const toggle = useCallback(
    ({ id }: { id: string }) => {
      const next = update((previous) => {
        const expanded = new Set(previous.expanded)
        if (expanded.has(id)) {
          expanded.delete(id)
        } else {
          expanded.add(id)
        }
        return { ...previous, expanded }
      })
      if (!next) {
        return
      }
      syncURL(next)
      if (next.expanded.has(id) && !next.branches.has(branchKey(id))) {
        void loadMore({ parentID: next.nodes.get(id)!.doc.id })
      }
    },
    [loadMore, syncURL, update],
  )
  const visible = useMemo(() => flattenTreeCache({ cache, pageSize }), [cache, pageSize])
  return (
    <Context
      value={
        enabled
          ? { ...visible, errors: cache.errors, loadMore, pending: cache.pending, toggle }
          : null
      }
    >
      {children}
    </Context>
  )
}
