'use client'

import { useRouter } from 'next/navigation.js'
import { useEffect } from 'react'

import type { DocumentInfo } from '../types.js'

import { useDocumentInfo } from '../index.js'

export const SetDocumentInfo: React.FC<DocumentInfo> = (props) => {
  const { setDocumentInfo } = useDocumentInfo()
  const router = useRouter()
  const { id } = props

  useEffect(() => {
    setDocumentInfo(props)
  }, [props, setDocumentInfo])

  useEffect(() => {
    router.refresh()
  }, [router, id])

  return null
}
