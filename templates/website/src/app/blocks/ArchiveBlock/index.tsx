import React from 'react'
import RichText from 'src/app/components/RichText'

import type { ArchiveBlockProps } from './types'

import { CollectionArchive } from '../../components/CollectionArchive'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = (props) => {
  const {
    id,
    categories,
    introContent,
    limit,
    populateBy,
    populatedDocs,
    populatedDocsTotal,
    relationTo,
    selectedDocs,
  } = props

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ml-0" content={introContent} enableGutter />
        </div>
      )}
      <CollectionArchive
        categories={categories}
        limit={limit}
        populateBy={populateBy}
        populatedDocs={populatedDocs}
        populatedDocsTotal={populatedDocsTotal}
        relationTo={relationTo}
        selectedDocs={selectedDocs}
        sort="-publishedAt"
      />
    </div>
  )
}
