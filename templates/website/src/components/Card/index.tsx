import React from 'react'
import Link from 'next/link'

import { Page, Post } from '../../payload-types'
import { Media } from '../Media'

import classes from './index.module.scss'

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  hideImagesOnMobile?: boolean
  title?: string
  relationTo?: 'pages' | 'posts'
  doc?: Page | Post
}> = props => {
  const {
    title: titleFromProps,
    relationTo,
    doc,
    doc: { slug, title, meta } = {},
    className,
  } = props

  const { description, image: metaImage } = meta || {}

  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space

  let href = ''
  if (relationTo === 'pages') {
    href = `/${slug}`
  } else if (relationTo === 'posts') {
    href = `/posts/${slug}`
  }

  return (
    <div className={[classes.card, className].filter(Boolean).join(' ')}>
      <Link href={href} className={classes.mediaWrapper}>
        {!metaImage && <div className={classes.placeholder}>No image</div>}
        {metaImage && typeof metaImage !== 'string' && (
          <Media imgClassName={classes.image} resource={metaImage} fill />
        )}
      </Link>
      {titleToUse && (
        <h4 className={classes.title}>
          <Link href={href}>{titleToUse}</Link>
        </h4>
      )}
      {description && (
        <div className={classes.body}>
          {description && <p className={classes.description}>{sanitizedDescription}</p>}
        </div>
      )}
    </div>
  )
}
