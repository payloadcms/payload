'use client'

import React, { Fragment } from 'react'

import type { ArchiveBlockProps } from '../../../_blocks/ArchiveBlock/types'
import { Card } from '../../Card'
import { Gutter } from '../../Gutter'

import classes from './index.module.scss'

export type Props = {
  className?: string
  selectedDocs?: ArchiveBlockProps['selectedDocs']
}

export const CollectionArchiveBySelection = (props: Props) => {
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
                <div key={index} className={classes.column}>
                  <Card relationTo="posts" doc={result} showCategories />
                </div>
              )
            })}
          </div>
        </Gutter>
      </Fragment>
    </div>
  )
}
