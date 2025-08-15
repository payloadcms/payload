'use client'

import LinkImport from 'next/link.js'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default
import React, { Fragment } from 'react'

import type { Post } from '../../../../payload-types.js'

import { Media } from '../Media/index.js'
import classes from './index.module.scss'

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: Post
  hideImagesOnMobile?: boolean
  orientation?: 'horizontal' | 'vertical'
  relationTo?: 'posts'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const {
    className,
    doc,
    orientation = 'vertical',
    relationTo,
    showCategories,
    title: titleFromProps,
  } = props

  const { slug, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = false // Categories are not available in this Post type
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space
  const href = `/live-preview/${relationTo}/${slug}`

  return (
    <div
      className={[classes.card, className, orientation && classes[orientation]]
        .filter(Boolean)
        .join(' ')}
    >
      <Link className={classes.mediaWrapper} href={href}>
        {!metaImage && <div className={classes.placeholder}>No image</div>}
        {metaImage && typeof metaImage !== 'string' && (
          <Media fill imgClassName={classes.image} resource={metaImage} />
        )}
      </Link>
      <div className={classes.content}>
        {titleToUse && (
          <h4 className={classes.title}>
            <Link className={classes.titleLink} href={href}>
              {titleToUse}
            </Link>
          </h4>
        )}
        {description && (
          <div className={classes.body}>
            {description && <p className={classes.description}>{sanitizedDescription}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
