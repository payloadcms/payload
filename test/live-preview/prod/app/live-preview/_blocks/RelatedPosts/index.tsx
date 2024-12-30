import React from 'react'

import type { Post } from '../../../../../payload-types.js'

import { Card } from '../../_components/Card/index.js'
import { Gutter } from '../../_components/Gutter/index.js'
import RichText from '../../_components/RichText/index.js'
import classes from './index.module.scss'

export type RelatedPostsProps = {
  blockName: string
  blockType: 'relatedPosts'
  docs?: (Post | string)[] | null
  introContent?: any
  relationTo: 'posts'
}

export const RelatedPosts: React.FC<RelatedPostsProps> = (props) => {
  const { docs, introContent, relationTo } = props

  return (
    <div className={classes.relatedPosts}>
      {introContent && (
        <Gutter className={classes.introContent}>
          <RichText content={introContent} />
        </Gutter>
      )}
      <Gutter>
        <div className={classes.grid}>
          {docs?.map((doc, index) => {
            if (typeof doc === 'string') return null

            return (
              <div
                className={[
                  classes.column,
                  docs.length === 2 && classes['cols-half'],
                  docs.length >= 3 && classes['cols-thirds'],
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={index}
              >
                <Card doc={doc} relationTo={relationTo} showCategories />
              </div>
            )
          })}
        </div>
      </Gutter>
    </div>
  )
}
