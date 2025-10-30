'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'pill-version-count'

export const VersionsPill: React.FC = () => {
  const { versionCount } = useDocumentInfo()

  if (!versionCount) {
    return null
  }

  return <span className={baseClass}>{versionCount}</span>
}
