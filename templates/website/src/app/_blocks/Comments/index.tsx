'use client'

import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Comment, Post, Project } from '../../../payload/payload-types'

import { Gutter } from '../../_components/Gutter'
import { HR } from '../../_components/HR'
import { Message } from '../../_components/Message'
import RichText from '../../_components/RichText'
import { formatDateTime } from '../../_utilities/formatDateTime'
import { CommentForm } from './CommentForm'
import classes from './index.module.scss'

export type CommentsBlockProps = {
  blockName: string
  blockType: 'comments'
  comments: Comment[]
  doc: Post | Project
  introContent?: any
  relationTo: 'posts' | 'projects'
}

export const CommentsBlock: React.FC<CommentsBlockProps> = (props) => {
  const { comments, doc, introContent } = props

  return (
    <div className={classes.commentsBlock}>
      {introContent && (
        <Gutter className={classes.introContent}>
          <RichText content={introContent} />
        </Gutter>
      )}
      <Gutter>
        <div className={classes.comments}>
          <HR />
          {comments?.map((com, index) => {
            const { _status, comment, createdAt, populatedUser } = com

            if (!comment) return null

            return (
              <Fragment key={index}>
                <div
                  className={[
                    classes.column,
                    comments.length === 2 && classes['cols-half'],
                    comments.length >= 3 && classes['cols-thirds'],
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {_status === 'draft' && (
                    <Message
                      message={
                        <Fragment>
                          {
                            'This is a draft comment. You are seeing it because you are an admin. To approve this comment, '
                          }
                          <Link
                            href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/comments/${com.id}`}
                          >
                            navigate to the admin dashboard
                          </Link>
                          {' and click "publish".'}
                        </Fragment>
                      }
                    />
                  )}
                  <p className={classes.comment}>"{comment}"</p>
                  {populatedUser && (
                    <p className={classes.meta}>
                      {populatedUser?.name || 'Unnamed User'}
                      {createdAt && ` on ${formatDateTime(createdAt)}`}
                    </p>
                  )}
                </div>
                {index < comments.length - 1 && <HR />}
              </Fragment>
            )
          })}
          <HR />
          <CommentForm docID={doc.id} />
        </div>
      </Gutter>
    </div>
  )
}
