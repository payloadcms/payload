'use client'

import { useEffect } from 'react'
import { useDocumentInfo } from '..'
import { DocumentInfo } from '../types'

export const SetDocumentInfo: React.FC<DocumentInfo> = (props) => {
  const { setDocumentInfo } = useDocumentInfo()

  useEffect(() => {
    setDocumentInfo(props)
  }, [props])

  return null
}
