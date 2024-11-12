import LinkWithDefault from 'next/link.js'
import React, { Fragment } from 'react'

import type { Post } from '../../../../../payload-types.js'

import { Media } from '../Media/index.js'
import classes from './index.module.scss'

const Link = (LinkWithDefault.default || LinkWithDefault) as typeof LinkWithDefault.default

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

  const { slug, categories, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
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
        {showCategories && hasCategories && (
          <div className={classes.leader}>
            {showCategories && hasCategories && (
              <div>
                {categories?.map((category, index) => {
                  const titleFromCategory = typeof category === 'string' ? category : category.title

                  const categoryTitle = titleFromCategory || 'Untitled category'

                  const isLast = index === categories.length - 1

                  return (
                    <Fragment key={index}>
                      {categoryTitle}
                      {!isLast && <Fragment>, &nbsp;</Fragment>}
                    </Fragment>
                  )
                })}
              </div>
            )}
          </div>
        )}
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
