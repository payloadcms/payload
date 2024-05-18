import React from 'react'
import RichText from 'src/app/components/RichText'

import type { Post } from '../../../payload-types'

import { Card } from '../../components/Card'

export type RelatedPostsProps = {
  blockName: string
  blockType: 'relatedPosts'
  docs?: (Post | string)[]
  introContent?: any
  relationTo: 'posts'
}

export const RelatedPosts: React.FC<RelatedPostsProps> = (props) => {
  const { docs, introContent, relationTo } = props

  return (
    <div className="classes.relatedPosts">
      {introContent && <RichText content={introContent} enableGutter={false} />}

      <div className="classes.grid">
        {docs?.map((doc, index) => {
          if (typeof doc === 'string') return null

          return (
            <div
              className={[
                'classes.column',
                docs.length === 2 && "classes['cols-half']",
                docs.length >= 3 && "classes['cols-thirds']",
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
    </div>
  )
}
