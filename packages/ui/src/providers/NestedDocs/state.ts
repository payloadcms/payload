import type { Column, NestedDocRow, PaginatedDocs } from 'payload'
import type React from 'react'

export type ParentID = null | number | string
export type Branch = { hasMore: boolean; ids: string[]; page: number }
export type TreeCache = {
  branches: Map<string, Branch>
  columns: Column[]
  errors: Set<string>
  expanded: Set<string>
  nodes: Map<
    string,
    {
      cells: Record<string, React.ReactNode>
      doc: PaginatedDocs['docs'][number]
      row: NestedDocRow
    }
  >
  pending: Set<string>
}

export const branchKey = (parentID: ParentID) => (parentID === null ? 'root' : `node:${parentID}`)

export function createTreeCache({
  columns,
  data,
  pageSize,
  rows,
}: {
  columns: Column[]
  data: PaginatedDocs
  pageSize: number
  rows: Record<string, NestedDocRow>
}): TreeCache {
  const nodes: TreeCache['nodes'] = new Map()
  const grouped = new Map<string, string[]>()
  const expanded = new Set<string>()

  data.docs.forEach((doc, index) => {
    const id = String(doc.id)
    const row = rows[id]
    if (!row) {
      return
    }
    nodes.set(id, {
      cells: Object.fromEntries(
        columns.map((column) => [column.accessor, column.renderedCells[index]]),
      ),
      doc,
      row,
    })
    const key = branchKey(row.parentID)
    grouped.set(key, [...(grouped.get(key) ?? []), id])
    if (row.isExpanded) {
      expanded.add(id)
    }
  })
  const branches = new Map<string, Branch>()
  branches.set('root', {
    hasMore: data.hasNextPage,
    ids: grouped.get('root') ?? [],
    page: Math.floor((grouped.get('root')?.length ?? 0) / pageSize),
  })
  for (const id of expanded) {
    const ids = grouped.get(branchKey(id)) ?? []
    branches.set(branchKey(id), {
      hasMore: Boolean(rows[id]?.hasMore),
      ids,
      page: Math.floor(ids.length / pageSize),
    })
  }
  return { branches, columns, errors: new Set(), expanded, nodes, pending: new Set() }
}

export function appendTreePage({
  cache,
  columns,
  data,
  page,
  parentID,
  rows,
}: {
  cache: TreeCache
  columns: Column[]
  data: PaginatedDocs
  page: number
  parentID: ParentID
  rows: Record<string, NestedDocRow>
}): TreeCache {
  const nodes = new Map(cache.nodes)
  const branches = new Map(cache.branches)
  const key = branchKey(parentID)
  const ids = new Set(branches.get(key)?.ids ?? [])
  data.docs.forEach((doc, index) => {
    const id = String(doc.id)
    ids.add(id)
    nodes.set(id, {
      cells: Object.fromEntries(
        columns.map((column) => [column.accessor, column.renderedCells[index]]),
      ),
      doc,
      row: { ...rows[id], parentID },
    })
  })
  branches.set(key, { hasMore: data.hasNextPage, ids: [...ids], page })
  if (parentID !== null && data.docs.length === 0 && page === 1) {
    const node = nodes.get(String(parentID))
    if (node) {
      nodes.set(String(parentID), { ...node, row: { ...node.row, hasChildren: false } })
    }
  }
  return { ...cache, branches, nodes }
}

export function flattenTreeCache({ cache, pageSize }: { cache: TreeCache; pageSize: number }) {
  const ids: string[] = []
  const rows = new Map<string, NestedDocRow>()
  const sentinels = new Map<string, ParentID[]>()
  const visited = new Set<string>()
  const visit = ({
    ancestorContinues,
    depth,
    parentID,
  }: {
    ancestorContinues: boolean[]
    depth: number
    parentID: ParentID
  }) => {
    const key = branchKey(parentID)
    const branch = cache.branches.get(key)
    const siblings = branch?.ids ?? []
    for (const [index, id] of siblings.entries()) {
      const node = cache.nodes.get(id)
      if (!node || visited.has(id)) {
        continue
      }
      visited.add(id)
      ids.push(id)
      const isLastSibling = index === siblings.length - 1 && !branch?.hasMore
      rows.set(id, {
        ...node.row,
        ancestorContinues,
        depth,
        isExpanded: cache.expanded.has(id),
        isLastSibling,
        limit: pageSize,
        parentID,
      })
      if (cache.expanded.has(id) && node.row.hasChildren) {
        visit({
          ancestorContinues: depth === 0 ? [] : [...ancestorContinues, !isLastSibling],
          depth: depth + 1,
          parentID: node.doc.id,
        })
      }
    }
    const lastID = ids.at(-1)
    if (lastID && (!branch || branch.hasMore || cache.pending.has(key) || cache.errors.has(key))) {
      sentinels.set(lastID, [...(sentinels.get(lastID) ?? []), parentID])
    }
  }
  visit({ ancestorContinues: [], depth: 0, parentID: null })
  return {
    columns: cache.columns.map((column) => ({
      ...column,
      renderedCells: ids.map((id) => cache.nodes.get(id)!.cells[column.accessor]),
    })),
    docs: ids.map((id) => cache.nodes.get(id)!.doc),
    rows: Object.fromEntries(rows),
    sentinels,
  }
}
