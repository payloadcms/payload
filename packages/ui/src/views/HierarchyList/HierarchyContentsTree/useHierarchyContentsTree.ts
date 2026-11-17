'use client'

import type { HierarchyContents } from 'payload'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { HierarchyContentsTreeState } from './state.js'

import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { mergeHierarchyContentsPage } from './state.js'

export type ParentID = null | number | string

export const branchKey = ({ id }: { id: ParentID }) => JSON.stringify(id)
export const allSourcesKey = '*'
const pageSize = 10

export function useHierarchyContentsTree({
  collectionSlug,
  initialContents,
}: {
  collectionSlug: string
  initialContents: HierarchyContents
}) {
  const { getHierarchyContents } = useServerFunctions()
  const initial = useMemo<HierarchyContentsTreeState>(
    () => ({
      branches: {
        [branchKey({ id: initialContents.parentID })]: {
          allowedCollections: initialContents.allowedCollections,
          errors: [],
          pending: [],
          sources: initialContents.sources,
        },
      },
      collectionSlug,
      expanded: new Set<string>(),
      groupExpansion: {},
    }),
    [collectionSlug, initialContents],
  )
  const [local, setLocal] = useState<{
    cache: HierarchyContentsTreeState
    origin: HierarchyContentsTreeState
  }>()
  const cache = local?.origin === initial ? local.cache : initial
  const active = useRef({ cache, origin: initial })
  const { branches, expanded, groupExpansion } = cache

  useLayoutEffect(() => {
    active.current = { cache, origin: initial }
  }, [cache, initial])

  const update = useCallback(
    (transform: (previous: HierarchyContentsTreeState) => HierarchyContentsTreeState) => {
      if (active.current.origin !== initial) {
        return
      }
      const next = transform(active.current.cache)

      active.current = { cache: next, origin: initial }
      setLocal({ cache: next, origin: initial })
    },
    [initial],
  )
  const setBranches = useCallback(
    (
      transform: (
        previous: HierarchyContentsTreeState['branches'],
      ) => HierarchyContentsTreeState['branches'],
    ) => update((previous) => ({ ...previous, branches: transform(previous.branches) })),
    [update],
  )
  const requests = useRef(
    new Map<string, { controller: AbortController; origin: HierarchyContentsTreeState }>(),
  )
  const container = useRef<HTMLDivElement>(null)
  const focusAfterLoad = useRef<{
    control: Element
    firstRow?: string
    id: ParentID
    origin: HierarchyContentsTreeState
  }>(null)

  useLayoutEffect(() => {
    const pendingFocus = focusAfterLoad.current
    if (!pendingFocus) {
      return
    }
    focusAfterLoad.current = null
    if (pendingFocus.origin !== initial || pendingFocus.control.isConnected) {
      return
    }
    const focusedElement = document.activeElement

    if (
      focusedElement &&
      focusedElement !== document.body &&
      focusedElement !== pendingFocus.control
    ) {
      return
    }
    const rows = Array.from(
      container.current?.querySelectorAll<HTMLTableRowElement>('tr[data-id]') ?? [],
    )
    const parentRow = rows.find(
      (row) => row.dataset.id === JSON.stringify([collectionSlug, pendingFocus.id]),
    )
    const firstRow = rows.find((row) => row.dataset.id === pendingFocus.firstRow)
    const target =
      parentRow?.querySelector<HTMLButtonElement>('button[aria-expanded]') ??
      firstRow?.querySelector<HTMLAnchorElement>('a') ??
      container.current?.querySelector<HTMLAnchorElement>('a')
    target?.focus()
  }, [branches, collectionSlug, initial])

  const load = useCallback(
    async ({
      id,
      control,
      page = 1,
      source,
    }: {
      control?: HTMLElement
      id: ParentID
      page?: number
      source?: string
    }) => {
      if (active.current.origin !== initial) {
        return
      }
      const key = branchKey({ id })
      const sourceKey = source ?? allSourcesKey
      const previousBranch = active.current.cache.branches[key]
      const previousSource = previousBranch?.sources.find(
        (value) => value.collectionSlug === source,
      )

      if (source !== undefined && (!previousSource || !previousSource.hasNextPage)) {
        return
      }
      if (
        source === undefined &&
        previousBranch &&
        !previousBranch.errors.includes(allSourcesKey)
      ) {
        return
      }
      const requestKey = JSON.stringify([key, sourceKey])
      const existing = requests.current.get(requestKey)

      if (existing?.origin === initial) {
        return
      }
      existing?.controller.abort()
      const controller = new AbortController()
      const origin = initial
      requests.current.set(requestKey, { controller, origin })
      setBranches((previous) => {
        const branch = previous[key] ?? { errors: [], pending: [], sources: [] }
        return {
          ...previous,
          [key]: {
            ...branch,
            errors: branch.errors.filter((value) => value !== sourceKey),
            pending: [...branch.pending, sourceKey],
          },
        }
      })
      try {
        const result = await getHierarchyContents({
          collectionSlug,
          limit: pageSize,
          page,
          parentID: id,
          signal: controller.signal,
          source,
        })
        if (!result || controller.signal.aborted || origin !== active.current.origin) {
          return
        }
        if (control && document.activeElement === control) {
          const firstSource = result.sources.find((value) => value.docs.length > 0)
          const firstDoc = firstSource?.docs[0]
          focusAfterLoad.current = {
            id,
            control,
            firstRow: firstDoc
              ? JSON.stringify([firstSource.collectionSlug, firstDoc.id])
              : undefined,
            origin,
          }
        }
        setBranches((previous) => {
          const branch = previous[key]
          return {
            ...previous,
            [key]: mergeHierarchyContentsPage({ branch, result, source }),
          }
        })
      } catch {
        if (!controller.signal.aborted && origin === active.current.origin) {
          setBranches((previous) => ({
            ...previous,
            [key]: { ...previous[key], errors: [...previous[key].errors, sourceKey] },
          }))
        }
      } finally {
        if (requests.current.get(requestKey)?.controller === controller) {
          requests.current.delete(requestKey)
        }
        if (!controller.signal.aborted && origin === active.current.origin) {
          setBranches((previous) => ({
            ...previous,
            [key]: {
              ...previous[key],
              pending: previous[key].pending.filter((value) => value !== sourceKey),
            },
          }))
        }
      }
    },
    [collectionSlug, getHierarchyContents, initial, setBranches],
  )

  useEffect(() => {
    const activeRequests = requests.current

    return () => {
      for (const [key, request] of activeRequests) {
        if (request.origin === initial) {
          request.controller.abort()
          activeRequests.delete(key)
        }
      }
    }
  }, [initial])

  const toggle = useCallback(
    ({ id }: { id: number | string }) => {
      const key = branchKey({ id })
      const isOpening = !active.current.cache.expanded.has(key)
      update((previous) => {
        const next = new Set(previous.expanded)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }
        return { ...previous, expanded: next }
      })
      if (isOpening && !active.current.cache.branches[key]) {
        void load({ id })
      }
    },
    [load, update],
  )

  const loadMore = useCallback(
    ({
      control,
      parentID,
      source,
    }: {
      control?: HTMLElement
      parentID: ParentID
      source?: string
    }) => {
      const previousSource = active.current.cache.branches[
        branchKey({ id: parentID })
      ]?.sources.find((value) => value.collectionSlug === source)

      return load({ id: parentID, control, page: (previousSource?.page ?? 0) + 1, source })
    },
    [load],
  )

  const isGroupExpanded = useCallback(
    ({ parentID, source }: { parentID: ParentID; source: string }) =>
      groupExpansion[JSON.stringify([parentID, source])] ?? parentID === null,
    [groupExpansion],
  )

  const toggleGroup = useCallback(
    ({ parentID, source }: { parentID: ParentID; source: string }) => {
      const key = JSON.stringify([parentID, source])

      update((previous) => ({
        ...previous,
        groupExpansion: {
          ...previous.groupExpansion,
          [key]: !(previous.groupExpansion[key] ?? parentID === null),
        },
      }))
    },
    [update],
  )

  return {
    branches,
    container,
    expanded,
    isGroupExpanded,
    loadMore,
    toggle,
    toggleGroup,
  }
}
