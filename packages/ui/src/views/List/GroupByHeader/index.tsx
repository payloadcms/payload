import type { ClientCollectionConfig, ViewTypes } from 'payload'

import React from 'react'

import { ListSelection } from '../ListSelection/index.js'

export const GroupByHeader: React.FC<{
  collectionConfig?: ClientCollectionConfig
  groupByFieldPath: string
  groupByValue: string
  heading: string
  viewType?: ViewTypes
}> = ({ collectionConfig, groupByFieldPath, groupByValue, heading, viewType }) => {
  return (
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
  )
}
