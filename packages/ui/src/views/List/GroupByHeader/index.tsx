import type { ClientCollectionConfig } from 'payload'

import React from 'react'

import { ListSelection } from '../ListSelection/index.js'

export const GroupByHeader: React.FC<{
  collectionConfig?: ClientCollectionConfig
  groupByFieldPath: string
  groupByValue: string
  heading: string
}> = ({ collectionConfig, groupByFieldPath, groupByValue, heading }) => {
  return (
    <ListSelection
      collectionConfig={collectionConfig}
      label={heading}
      modalPrefix={groupByValue}
      where={{
        [groupByFieldPath]: {
          equals: groupByValue,
        },
      }}
    />
  )
}
