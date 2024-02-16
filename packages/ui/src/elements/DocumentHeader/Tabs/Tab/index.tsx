import React from 'react'

import { DocumentTabLink } from './TabLink'

import { DocumentTabConfig, DocumentTabProps } from 'payload/types'

import './index.scss'

export const baseClass = 'doc-tab'

export const DocumentTab: React.FC<DocumentTabProps & DocumentTabConfig> = (props) => {
  const { href, collectionConfig, globalConfig, label, newTab, Pill } = props

  return (
    <DocumentTabLink
      href={href}
      newTab={newTab}
      baseClass={baseClass}
      isCollection={!!collectionConfig && !globalConfig}
    >
      <span className={`${baseClass}__label`}>
        {label}
        {Pill}
      </span>
    </DocumentTabLink>
  )
}
