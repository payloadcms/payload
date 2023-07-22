import React from 'react'
import { Cell, Grid } from '@faceless-ui/css-grid'

import { CollectionArchive } from '../../components/CollectionArchive'
import { Gutter } from '../../components/Gutter'
import RichText from '../../components/RichText'
import { ArchiveBlockProps } from './types'

import classes from './index.module.scss'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = props => {
  const {
    introContent,
    id,
    relationTo,
    populateBy,
    limit,
    populatedDocs,
    populatedDocsTotal,
    categories,
  } = props

  return (
    <div id={`block-${id}`} className={classes.archiveBlock}>
      {introContent && (
        <Gutter className={classes.introContent}>
          <Grid>
            <Cell cols={12} colsM={8}>
              <RichText content={introContent} />
            </Cell>
          </Grid>
        </Gutter>
      )}
      <CollectionArchive
        populateBy={populateBy}
        relationTo={relationTo}
        populatedDocs={populatedDocs}
        populatedDocsTotal={populatedDocsTotal}
        categories={categories}
        limit={limit}
        sort="-publishedDate"
      />
    </div>
  )
}
