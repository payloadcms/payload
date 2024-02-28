'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import type { DocumentInfo } from '../types'

import { useDocumentInfo } from '..'

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
