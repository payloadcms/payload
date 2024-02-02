import React from 'react'

import type { ArchiveBlockProps } from '../../_blocks/ArchiveBlock/types'
import { CollectionArchiveBySelection } from './PopulateBySelection'
import { CollectionArchiveByCollection } from './PopulateByCollection'

export type Props = Omit<ArchiveBlockProps, 'blockType'> & {
  className?: string
  sort?: string
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { className, populateBy, selectedDocs } = props

  if (populateBy === 'selection') {
    return <CollectionArchiveBySelection selectedDocs={selectedDocs} className={className} />
  }

  if (populateBy === 'collection') {
    return <CollectionArchiveByCollection {...props} className={className} />
  }

  return null
}
