import React from 'react'

import type { ArchiveBlockProps } from '../../_blocks/ArchiveBlock/types'

import { CollectionArchiveByCollection } from './PopulateByCollection'
import { CollectionArchiveBySelection } from './PopulateBySelection'

export type Props = Omit<ArchiveBlockProps, 'blockType'> & {
  className?: string
  sort?: string
}

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
