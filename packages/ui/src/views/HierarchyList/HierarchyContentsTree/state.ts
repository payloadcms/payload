import type { HierarchyContents } from 'payload'

export type HierarchyContentsBranch = {
  allowedCollections?: string[]
  errors: string[]
  pending: string[]
  sources: HierarchyContents['sources']
}

export type HierarchyContentsTreeState = {
  branches: Record<string, HierarchyContentsBranch>
  collectionSlug: string
  expanded: Set<string>
  groupExpansion: Record<string, boolean>
}

export function mergeHierarchyContentsPage({
  branch,
  result,
  source,
}: {
  branch: HierarchyContentsBranch
  result: HierarchyContents
  source?: string
}): HierarchyContentsBranch {
  const sources = source
    ? branch.sources.map((existing) => {
        if (existing.collectionSlug !== source) {
          return existing
        }

        const next = result.sources.find((value) => value.collectionSlug === source)

        if (!next) {
          return { ...existing, hasNextPage: false }
        }

        const docs = new Map([...existing.docs, ...next.docs].map((doc) => [String(doc.id), doc]))

        return { ...next, docs: [...docs.values()] }
      })
    : result.sources

  return { ...branch, allowedCollections: result.allowedCollections, sources }
}
