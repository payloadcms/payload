import { cn } from '@/utilities/cn'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '../../../payload-types'

import { Media } from '../Media'

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
  const href = `/${relationTo}/${slug}`

  return (
    <article className={cn('border border-border rounded-lg overflow-hidden bg-card', className)}>
      <Link className="relative h-full w-full " href={href}>
        {!metaImage && <div className="classes.placeholder">No image</div>}
        {metaImage && typeof metaImage !== 'string' && <Media resource={metaImage} size="360px" />}
      </Link>
      <div className="p-4">
        {showCategories && hasCategories && (
          <div className="uppercase text-sm mb-4">
            {showCategories && hasCategories && (
              <div>
                {categories?.map((category, index) => {
                  if (typeof category === 'object') {
                    const { title: titleFromCategory } = category

                    const categoryTitle = titleFromCategory || 'Untitled category'

                    const isLast = index === categories.length - 1

                    return (
                      <Fragment key={index}>
                        {categoryTitle}
                        {!isLast && <Fragment>, &nbsp;</Fragment>}
                      </Fragment>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>
        )}
        {titleToUse && (
          <h3 className="font-bold">
            <Link className="classes.titleLink" href={href}>
              {titleToUse}
            </Link>
          </h3>
        )}
        {description && (
          <div className="mt-2">
            {description && <p className="classes.description">{sanitizedDescription}</p>}
          </div>
        )}
      </div>
    </article>
  )
}
