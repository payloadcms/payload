'use client'
import React from 'react'

import { useDocumentInfo } from '../../../../../providers/DocumentInfo/index.js'
import './index.scss'

const baseClass = 'pill-version-count'

export const VersionsPill: React.FC = () => {
  const { versionCount } = useDocumentInfo()

  if (!versionCount) {
    return null
  }

  return <span className={baseClass}>{versionCount}</span>
}
