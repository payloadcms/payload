'use client'

import React, { Fragment } from 'react'

import { Comment, Post, Project } from '../../../payload/payload-types'
import { Gutter } from '../../_components/Gutter'
import { HR } from '../../_components/HR'
import RichText from '../../_components/RichText'
import { formatDateTime } from '../../_utilities/formatDateTime'
import { CommentForm } from './CommentForm'

import classes from './index.module.scss'

export type CommentsBlockProps = {
  blockType: 'comments'
  blockName: string
  introContent?: any
  doc: Post | Project
  relationTo: 'posts' | 'projects'
  comments: Comment[]
}

export const CommentsBlock: React.FC<CommentsBlockProps> = props => {
  const { introContent, doc, comments } = props

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
            const { fullUser, comment, createdAt } = com

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
                  <p className={classes.comment}>{comment}</p>
                  {fullUser && (
                    <p className={classes.meta}>
                      {fullUser?.name || 'Unnamed User'}
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
