'use client'
import type { Column, NestedDocRow, PaginatedDocs, Sort } from 'payload'

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

import type { NestedDocsTreeCache, ParentID } from './state.js'

import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useRouter } from '../RouterAdapter/index.js'
import { useServerFunctions } from '../ServerFunctions/index.js'
import { appendTreePage, branchKey, createTreeCache, flattenTreeCache } from './state.js'

const Context = createContext<{
  columns: Column[]
  continuationsByRowID: Map<string, ParentID[]>
  docs: PaginatedDocs['docs']
  errors: Set<string>
  loadMore: (args: { parentID: ParentID }) => Promise<void>
  pending: Set<string>
  rows: Record<string, NestedDocRow>
  toggle: (args: { id: string }) => void
} | null>(null)
export const useNestedDocsTree = () => use(Context)

export function NestedDocsTreeProvider({
  children,
  collectionSlug,
  columns,
  data,
  enabled,
  initialExpanded,
  rows,
  sort,
}: {
  children: React.ReactNode
  collectionSlug: string
  columns: Column[]
  data: PaginatedDocs
  enabled: boolean
  initialExpanded?: string[]
  rows?: Record<string, NestedDocRow>
  sort?: Sort
}) {
  const { getTableState } = useServerFunctions()
  const router = useRouter()
  const pageSize = Math.min(100, Math.max(1, Number(data.limit) || 10))
  const initial = useMemo(() => {
    const cache = createTreeCache({ columns, data, pageSize, rows: rows ?? {} })
    for (const id of initialExpanded ?? []) {
      cache.expanded.add(id)
    }
    return { ...cache, sort }
  }, [columns, data, initialExpanded, rows, pageSize, sort])
  const [local, setLocal] = useState<{ cache: NestedDocsTreeCache; origin: NestedDocsTreeCache }>()
  const cache = local?.origin === initial ? local.cache : initial
  const active = useRef({ cache, origin: initial })
  useLayoutEffect(() => {
    active.current = { cache, origin: initial }
  }, [cache, initial])
  const requests = useRef(
    new Map<string, { controller: AbortController; origin: NestedDocsTreeCache }>(),
  )
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

  const persistExpansionState = useCallback(
    ({ cache: next }: { cache: NestedDocsTreeCache }) => {
      const params = parseSearchParams(new URLSearchParams(window.location.search))
      params.treeExpanded = next.expanded.size > 0 ? [...next.expanded] : ''
      const search = qs.stringify(params, { addQueryPrefix: true })
      router.replaceState(search)
    },
    [router],
  )
  const update = useCallback(
    ({ transform }: { transform: (previous: NestedDocsTreeCache) => NestedDocsTreeCache }) => {
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
      const key = branchKey({ parentID })
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
      update({
        transform: (previous) => ({
          ...previous,
          errors: new Set([...previous.errors].filter((value) => value !== key)),
          pending: new Set(previous.pending).add(key),
        }),
      })
      const page = (branch?.page ?? 0) + 1
      try {
        const result = await getTableState({
          collectionSlug,
          columns: columns.map(({ accessor, active }) => ({ accessor, active })),
          enableRowSelections: true,
          nestedDocs: { parentID },
          orderableFieldName: '',
          query: { limit: pageSize, page, sort },
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
        if (controller.signal.aborted) {
          return
        }
        const resultRows = result.nestedDocRows
        update({
          transform: (previous) =>
            appendTreePage({
              cache: previous,
              columns: result.state,
              data: result.data,
              page,
              parentID,
              rows: resultRows,
            }),
        })
      } catch {
        if (!controller.signal.aborted) {
          update({
            transform: (previous) => ({ ...previous, errors: new Set(previous.errors).add(key) }),
          })
        }
      } finally {
        if (requests.current.get(key)?.controller === controller) {
          requests.current.delete(key)
        }
        update({
          transform: (previous) => ({
            ...previous,
            pending: new Set([...previous.pending].filter((value) => value !== key)),
          }),
        })
      }
    },
    [collectionSlug, columns, getTableState, initial, pageSize, sort, update],
  )
  const toggle = useCallback(
    ({ id }: { id: string }) => {
      const next = update({
        transform: (previous) => {
          const expanded = new Set(previous.expanded)
          if (expanded.has(id)) {
            expanded.delete(id)
          } else {
            expanded.add(id)
          }
          return { ...previous, expanded }
        },
      })
      if (!next) {
        return
      }
      persistExpansionState({ cache: next })
      if (next.expanded.has(id) && !next.branches.has(branchKey({ parentID: id }))) {
        void loadMore({ parentID: next.nodes.get(id)!.doc.id })
      }
    },
    [loadMore, persistExpansionState, update],
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
