'use client'
import React, { Fragment } from 'react'
import { useDocumentInfo } from '../../../../../providers/DocumentInfo'

import { baseClass } from '../../Tab'

export const VersionPill: React.FC = () => {
  const { versions } = useDocumentInfo()

  if (!(typeof versions?.totalDocs === 'number' && versions?.totalDocs > 0)) return null

  return (
    <Fragment>
      &nbsp;
      <span className={`${baseClass}__count`}>{versions?.totalDocs.toString()}</span>
    </Fragment>
  )
}
