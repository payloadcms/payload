import { PAYLOAD_SERVER_URL } from '@/app/_api/serverURL'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '../../../payload-types'

import { Gutter } from '../../_components/Gutter'
import { Media } from '../../_components/Media'
import RichText from '../../_components/RichText'
import { formatDateTime } from '../../_utilities/formatDateTime'
import classes from './index.module.scss'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { id, createdAt, meta: { description, image: metaImage } = {} } = post

  return (
    <Fragment>
      <Gutter className={classes.postHero}>
        <div className={classes.content}>
          <RichText className={classes.richText} content={post?.hero?.richText} />
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
              .
            </p>
          </div>
        </div>
        <div className={classes.media}>
          <div className={classes.mediaWrapper}>
            {!metaImage && <div className={classes.placeholder}>No image</div>}
            {metaImage && typeof metaImage !== 'string' && (
              <Media fill imgClassName={classes.image} resource={metaImage} />
            )}
          </div>
          {metaImage && typeof metaImage !== 'string' && metaImage?.caption && (
            <RichText className={classes.caption} content={metaImage.caption} />
          )}
        </div>
      </Gutter>
    </Fragment>
  )
}
