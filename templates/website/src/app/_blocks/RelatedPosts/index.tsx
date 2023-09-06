import React from 'react'

import { Post, Project } from '../../../payload/payload-types'
import { Card } from '../../_components/Card'
import { Gutter } from '../../_components/Gutter'
import RichText from '../../_components/RichText'

import classes from './index.module.scss'

export type RelatedPostsProps = {
  blockType: 'relatedPosts'
  blockName: string
  introContent?: any
  docs?: (string | Post | Project)[]
  relationTo: 'posts' | 'projects'
}

export const RelatedPosts: React.FC<RelatedPostsProps> = props => {
  const { introContent, docs, relationTo } = props

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
                key={index}
                className={[
                  classes.column,
                  docs.length === 2 && classes['cols-half'],
                  docs.length >= 3 && classes['cols-thirds'],
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Card relationTo={relationTo} doc={doc} showCategories />
              </div>
            )
          })}
        </div>
      </Gutter>
    </div>
  )
}
