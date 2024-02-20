'use client'

import { useEffect } from 'react'
import { useDocumentInfo } from '..'

export const SetDocumentInfo: React.FC<{
  collectionSlug: string
  globalSlug: string
  id: string
}> = ({ collectionSlug, globalSlug, id }) => {
  const { setDocumentInfo } = useDocumentInfo()

  useEffect(() => {
    setDocumentInfo({ collectionSlug, globalSlug, id })
  }, [collectionSlug, globalSlug, id, setDocumentInfo])

  return null
}
