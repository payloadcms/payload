import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '../../../payload-types'

import { Gutter } from '../../components/Gutter'
import { Media } from '../../components/Media'
import RichText from '../../components/RichText'
import { formatDateTime } from '../../utilities/formatDateTime'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const {
    id,
    categories,
    meta: { description, image: metaImage } = {},
    populatedAuthors,
    publishedAt,
    title,
  } = post

  return (
    <div className="classes.postHero">
      <div className="classes.content">
        <div className="classes.leader">
          <div className="classes.categories">
            {categories?.map((category, index) => {
              if (typeof category === 'object' && category !== null) {
                const { title: categoryTitle } = category

                const titleToUse = categoryTitle || 'Untitled category'

                const isLast = index === categories.length - 1

                return (
                  <Fragment key={index}>
                    {titleToUse}
                    {!isLast && <Fragment>, &nbsp;</Fragment>}
                  </Fragment>
                )
              }
              return null
            })}
          </div>
        </div>
        <h1 className="classes.title">{title}</h1>
        <p className="classes.meta">
          {populatedAuthors && (
            <Fragment>
              {'By '}
              {populatedAuthors.map((author, index) => {
                const { name } = author

                const isLast = index === populatedAuthors.length - 1
                const secondToLast = index === populatedAuthors.length - 2

                return (
                  <Fragment key={index}>
                    {name}
                    {secondToLast && populatedAuthors.length > 2 && <Fragment>, </Fragment>}
                    {secondToLast && populatedAuthors.length === 2 && <Fragment> </Fragment>}
                    {!isLast && populatedAuthors.length > 1 && <Fragment>and </Fragment>}
                  </Fragment>
                )
              })}
            </Fragment>
          )}
          {publishedAt && (
            <Fragment>
              {' on '}
              {formatDateTime(publishedAt)}
            </Fragment>
          )}
        </p>
        <div>
          <p className="classes.description">
            {`${description ? `${description} ` : ''}To edit this post, `}
            <Link href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/posts/${id}`}>
              navigate to the admin dashboard
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="classes.media">
        <div className="relative">
          {!metaImage && <div className="classes.placeholder">No image</div>}
          {metaImage && typeof metaImage !== 'string' && (
            <Media fill imgClassName="classes.image" resource={metaImage} />
          )}
        </div>
        {metaImage && typeof metaImage !== 'string' && metaImage?.caption && (
          <RichText className="classes.caption" content={metaImage.caption} enableGutter={false} />
        )}
      </div>
    </div>
  )
}
