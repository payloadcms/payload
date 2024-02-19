'use client'

import { useEffect } from 'react'
import { useDocumentInfo } from '..'

export const SetDocumentInfo: React.FC<{
  collectionSlug: string
  globalSlug: string
  id: string
  versionsConfig?: any
}> = ({ collectionSlug, globalSlug, id, versionsConfig }) => {
  const { setDocumentInfo } = useDocumentInfo()

  useEffect(() => {
    setDocumentInfo({ collectionSlug, globalSlug, id, versionsConfig })

    return () => {
      // reset on navigation away
      setDocumentInfo({})
    }
  }, [collectionSlug, globalSlug, id, setDocumentInfo, versionsConfig])

  return null
}
