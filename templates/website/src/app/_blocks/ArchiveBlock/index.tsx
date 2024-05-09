import React from 'react'
import RichText from 'src/app/_components/RichTextLexical'

import type { ArchiveBlockProps } from './types'

import { CollectionArchive } from '../../_components/CollectionArchive'
import { Gutter } from '../../_components/Gutter'
import classes from './index.module.scss'

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
    <div className={classes.archiveBlock} id={`block-${id}`}>
      {introContent && (
        <Gutter className={classes.introContent}>
          <RichText content={introContent} enableGutter={false} />
        </Gutter>
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
