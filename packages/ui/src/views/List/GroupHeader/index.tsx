import type { ClientCollectionConfig } from 'payload'

import React from 'react'

import { ListSelection } from '../ListSelection/index.js'
import './index.scss'

const baseClass = 'table-group-header'

export const TableGroupHeader: React.FC<{
  collectionConfig?: ClientCollectionConfig
  heading: string
}> = ({ collectionConfig, heading }) => {
  return (
    <header className={baseClass}>
      <h4 className={`${baseClass}__heading`}>{heading}</h4>
      <ListSelection collectionConfig={collectionConfig} label={heading} />
    </header>
  )
}
