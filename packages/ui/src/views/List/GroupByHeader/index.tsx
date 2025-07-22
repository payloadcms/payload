import type { ClientCollectionConfig } from 'payload'

import React from 'react'

import { ListSelection } from '../ListSelection/index.js'
import './index.scss'

const baseClass = 'group-by-header'

export const GroupByHeader: React.FC<{
  collectionConfig?: ClientCollectionConfig
  groupByValue?: string
  heading: string
}> = ({ collectionConfig, groupByValue, heading }) => {
  return (
    <header className={baseClass}>
      <h4 className={`${baseClass}__heading`}>{heading}</h4>
      <ListSelection
        collectionConfig={collectionConfig}
        label={heading}
        modalPrefix={groupByValue}
      />
    </header>
  )
}
