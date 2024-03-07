'use client'
import React from 'react'

import { useDocumentInfo } from '../../../../../providers/DocumentInfo/index.js'
import { baseClass } from '../../Tab/index.js'

export const VersionsPill: React.FC = () => {
  const { versions } = useDocumentInfo()
  return <span className={`${baseClass}__count`}>{versions?.totalDocs?.toString()}</span>
}
