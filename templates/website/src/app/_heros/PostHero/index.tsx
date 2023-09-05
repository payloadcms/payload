import React, { Fragment } from 'react'
import Link from 'next/link'

import { Post } from '../../../payload/payload-types'
import { Gutter } from '../../_components/Gutter'
import { Media } from '../../_components/Media'
import RichText from '../../_components/RichText'
import { formatDateTime } from '../../_utilities/formatDateTime'

import classes from './index.module.scss'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const {
    id,
    title,
    categories,
    meta: { image: metaImage, description } = {},
    publishedOn,
    populatedAuthors,
  } = post

  return (
    <Fragment>
      <Gutter className={classes.postHero}>
        <div className={classes.content}>
          <div className={classes.leader}>
            <div className={classes.categories}>
              {categories?.map((category, index) => {
                const { title: categoryTitle } = category

                const titleToUse = categoryTitle || 'Untitled category'

                const isLast = index === categories.length - 1

                return (
                  <Fragment key={index}>
                    {titleToUse}
                    {!isLast && <Fragment>, &nbsp;</Fragment>}
                  </Fragment>
                )
              })}
            </div>
          </div>
          <h1 className={classes.title}>{title}</h1>
          <p className={classes.meta}>
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
            {publishedOn && (
              <Fragment>
                {' on '}
                {formatDateTime(publishedOn)}
              </Fragment>
            )}
          </p>
          <div>
            <p className={classes.description}>
              {`${description ? `${description} ` : ''}To edit this post, `}
              <Link href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/posts/${id}`}>
                navigate to the admin dashboard
              </Link>
              {'.'}
            </p>
          </div>
        </div>
        <div className={classes.media}>
          <div className={classes.mediaWrapper}>
            {!metaImage && <div className={classes.placeholder}>No image</div>}
            {metaImage && typeof metaImage !== 'string' && (
              <Media imgClassName={classes.image} resource={metaImage} fill />
            )}
          </div>
          {metaImage && typeof metaImage !== 'string' && metaImage?.caption && (
            <RichText content={metaImage.caption} className={classes.caption} />
          )}
        </div>
      </Gutter>
    </Fragment>
  )
}
