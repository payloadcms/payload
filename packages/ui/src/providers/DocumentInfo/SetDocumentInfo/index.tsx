'use client'

import { useEffect } from 'react'

import type { DocumentInfo } from '../types'

import { useDocumentInfo } from '..'

/**
 * This component can be rendered within a RSC
 * to set the documentInfo on the first client render
 **/
export const SetDocumentInfo: React.FC<DocumentInfo> = (props) => {
  const { setDocumentInfo } = useDocumentInfo()

  useEffect(() => {
    setDocumentInfo(props)
  }, [props, setDocumentInfo])

  return null
}
