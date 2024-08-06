import React, { Fragment } from 'react'
import Link from 'next/link'

import { Post } from '../../../payload-types'
import { Gutter } from '../../_components/Gutter'
import { Media } from '../../_components/Media'
import RichText from '../../_components/RichText'
import { formatDateTime } from '../../_utilities/formatDateTime'

import classes from './index.module.scss'
import { PAYLOAD_SERVER_URL } from '@/app/_api/serverURL'

export type PostHeroProps = {
  post: Post
}

export const PostHero = ({ post }: PostHeroProps) => {
  const { id, meta: { image: metaImage, description } = {}, createdAt } = post

  return (
    <Fragment>
      <Gutter className={classes.postHero}>
        <div className={classes.content}>
          <RichText content={post?.hero?.richText} className={classes.richText} />
          <p className={classes.meta}>
            {createdAt && (
              <Fragment>
                {'Created on '}
                {formatDateTime(createdAt)}
              </Fragment>
            )}
          </p>
          <div>
            <p className={classes.description}>
              {`${description ? `${description} ` : ''}To edit this post, `}
              <Link href={`${PAYLOAD_SERVER_URL}/admin/collections/posts/${id}`}>
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
