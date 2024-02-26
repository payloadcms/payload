'use client'

import { useEffect } from 'react'

import type { DocumentInfo } from '../types'

import { useDocumentInfo } from '..'

export const SetDocumentInfo: React.FC<DocumentInfo> = (props) => {
  const { setDocumentInfo } = useDocumentInfo()

  useEffect(() => {
    setDocumentInfo(props)
  }, [props])

  return null
}
