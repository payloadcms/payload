import React from 'react'

import type { ArchiveBlockProps } from '../../_blocks/ArchiveBlock/types'
import { CollectionArchiveBySelection } from './PopulateBySelection'
import { CollectionArchiveByCollection } from './PopulateByCollection'

export type CollectionArchiveProps = Omit<ArchiveBlockProps, 'blockType'> & {
  className?: string
  sort?: string
}

export const CollectionArchive = (props: CollectionArchiveProps) => {
  const { className, populateBy, selectedDocs } = props

  if (populateBy === 'selection') {
    return <CollectionArchiveBySelection selectedDocs={selectedDocs} className={className} />
  }

  if (populateBy === 'collection') {
    return <CollectionArchiveByCollection {...props} className={className} />
  }

  return null
}
