'use client'
import React, { Fragment } from 'react'

import { useDocumentInfo } from '../../../../../providers/DocumentInfo/index.js'
import { baseClass } from '../../Tab/index.js'

export const VersionsPill: React.FC = () => {
  const { versions } = useDocumentInfo()

  return (
    <span className={`${baseClass}__count`}>
      {versions?.totalDocs > 0 ? versions.totalDocs.toString() : <Fragment>&nbsp;</Fragment>}
    </span>
  )
}
