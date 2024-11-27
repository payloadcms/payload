'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

import { baseClass } from '../../Tab/index.js'

export const VersionsPill: React.FC = () => {
  const { versionCount } = useDocumentInfo()

  if (!versionCount) {
    return null
  }

  return <span className={`${baseClass}__count`}>{versionCount}</span>
}
