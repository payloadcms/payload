import React from 'react'

import type { ArchiveBlockProps } from '../../_blocks/ArchiveBlock/types.js'

import { CollectionArchiveByCollection } from './PopulateByCollection/index.js'
import { CollectionArchiveBySelection } from './PopulateBySelection/index.js'

export type Props = {
  className?: string
  sort?: string
} & Omit<ArchiveBlockProps, 'blockType'>

export const CollectionArchive: React.FC<Props> = (props) => {
  const { className, populateBy, selectedDocs } = props

  if (populateBy === 'selection') {
    return <CollectionArchiveBySelection className={className} selectedDocs={selectedDocs} />
  }

  if (populateBy === 'collection') {
    return <CollectionArchiveByCollection {...props} className={className} />
  }

  return null
}
