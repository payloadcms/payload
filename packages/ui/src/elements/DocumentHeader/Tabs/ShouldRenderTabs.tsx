'use client'
import React from 'react'
import { useDocumentInfo } from '../../../providers/DocumentInfo'

export const ShouldRenderTabs: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { collectionSlug, globalSlug, id: idFromContext } = useDocumentInfo()

  const id = idFromContext !== 'create' ? idFromContext : null

  // Don't show tabs when creating new documents
  if ((collectionSlug && id) || globalSlug) {
    return children
  }

  return null
}
