import LinkWithDefault from 'next/link.js'
import React, { Fragment } from 'react'

import type { Post } from '../../../../payload-types.js'

import { PAYLOAD_SERVER_URL } from '../../_api/serverURL.js'
import { Gutter } from '../../_components/Gutter/index.js'
import { Media } from '../../_components/Media/index.js'
import RichText from '../../_components/RichText/index.js'
import { formatDateTime } from '../../_utilities/formatDateTime.js'
import classes from './index.module.scss'

const Link = (LinkWithDefault.default || LinkWithDefault) as typeof LinkWithDefault.default

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
