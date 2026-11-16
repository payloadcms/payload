'use client'

import type { HierarchyContents } from 'payload'

import { useState } from 'react'

export function useHierarchyContentsSelectionScope({
  collectionSlug,
  contents,
  isEnabled,
  parentID,
}: {
  collectionSlug: string
  contents?: HierarchyContents
  isEnabled: boolean
  parentID: null | number | string
}): string | undefined {
  const [previous, setPrevious] = useState(() => ({ contents, revision: 0 }))
  const current =
    previous.contents === contents ? previous : { contents, revision: previous.revision + 1 }

  if (current !== previous) {
    setPrevious(current)
  }

  return isEnabled ? JSON.stringify([collectionSlug, parentID, current.revision]) : undefined
}
