'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

import { baseClass } from '../../Tab/index.js'

export const VersionsPill: React.FC = () => {
  const { versions } = useDocumentInfo()

  // don't count snapshots
  const totalVersions = versions?.docs.filter((version) => !version.snapshot).length || 0

  if (!versions?.totalDocs) {
    return null
  }

  return <span className={`${baseClass}__count`}>{totalVersions}</span>
}
