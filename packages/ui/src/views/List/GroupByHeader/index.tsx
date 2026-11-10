import type { ClientCollectionConfig, ViewTypes } from 'payload'

import React from 'react'

import { ListSelection } from '../ListSelection/index.js'
import './index.scss'

const baseClass = 'group-by-header'

export const GroupByHeader: React.FC<{
  collectionConfig?: ClientCollectionConfig
  groupByFieldPath: string
  groupByValue: string
  heading: string
  viewType?: ViewTypes
}> = ({ collectionConfig, groupByFieldPath, groupByValue, heading, viewType }) => {
  return (
    <header className={baseClass}>
      <h4 className={`${baseClass}__heading`} data-group-id={groupByValue}>
        {heading}
      </h4>
      <ListSelection
        collectionConfig={collectionConfig}
        label={heading}
        modalPrefix={groupByValue}
        viewType={viewType}
        where={{
          [groupByFieldPath]: {
            equals: groupByValue,
          },
        }}
      />
    </header>
  )
}
