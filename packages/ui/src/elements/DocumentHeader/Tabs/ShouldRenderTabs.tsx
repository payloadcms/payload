'use client'
import React from 'react'
import { useSearchParams } from '../../../providers/SearchParams'

export const ShouldRenderTabs: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const {
    params: { collection: collectionSlug, global: globalSlug, segments: [idFromParam] = [] },
  } = useSearchParams()

  const id = idFromParam !== 'create' ? idFromParam : null

  // Don't show tabs when creating new documents
  if ((collectionSlug && id) || globalSlug) {
    return children
  }

  return null
}
