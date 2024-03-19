'use client'

import React, { Fragment } from 'react'

import type { ArchiveBlockProps } from '../../../_blocks/ArchiveBlock/types.js'

import { Card } from '../../Card/index.js'
import { Gutter } from '../../Gutter/index.js'
import classes from './index.module.scss'

export type Props = {
  className?: string
  selectedDocs?: ArchiveBlockProps['selectedDocs']
}

export const CollectionArchiveBySelection: React.FC<Props> = (props) => {
  const { className, selectedDocs } = props

  const result = selectedDocs?.map((doc) => doc.value)

  return (
    <div className={[classes.collectionArchive, className].filter(Boolean).join(' ')}>
      <Fragment>
        <Gutter>
          <div className={classes.grid}>
            {result?.map((result, index) => {
              if (typeof result === 'string') {
                return null
              }

              return (
                <div className={classes.column} key={index}>
                  <Card doc={result} relationTo="posts" showCategories />
                </div>
              )
            })}
          </div>
        </Gutter>
      </Fragment>
    </div>
  )
}
