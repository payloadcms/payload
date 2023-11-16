'use client'

import React, { Fragment, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Comment } from '../../../../payload/payload-types'
import { Button } from '../../../_components/Button'
import { Input } from '../../../_components/Input'
import { Message } from '../../../_components/Message'
import { useAuth } from '../../../_providers/Auth'

import classes from './index.module.scss'

type FormData = {
  comment: string
}

export const CommentForm: React.FC<{
  docID: string
}> = ({ docID }) => {
  const pathname = usePathname()
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<React.ReactNode | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
    reset,
  } = useForm<FormData>()

  const { user } = useAuth()

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!user) return

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // All comments are created as drafts so that they can be moderated before being published
            // Navigate to the admin dashboard and change the comment status to "published" for it to appear on the site
            status: 'draft',
            doc: docID,
            user: user.id,
            ...data,
          }),
        })

        const json: Comment & {
          message?: string
        } = await res.json()

        if (!res.ok) throw new Error(json.message)

        setError(null)

        setSuccess(
          <Fragment>
            {'Your comment was submitted for moderation successfully. To approve it, '}
            <Link
              href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/comments/${
                typeof json.doc === 'object' ? json.doc.id : json.doc
              }`}
            >
              navigate to the admin dashboard
            </Link>
            {' and click "publish".'}
          </Fragment>,
        )

        reset()
      } catch (_) {
        setError('Something went wrong')
      }
    },
    [docID, user, reset],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
      <Message error={error} success={success} className={classes.message} />
      <Input
        name="comment"
        label="Comment"
        required
        register={register}
        error={errors.comment}
        type="textarea"
        placeholder={user ? 'Leave a comment' : 'Login to leave a comment'}
        disabled={!user}
        validate={value => {
          if (!value) return 'Please enter a comment'
          if (value.length < 3) return 'Please enter a comment over 3 characters'
          if (value.length > 500) return 'Please enter a comment under 500 characters'
          return true
        }}
      />
      {!user ? (
        <Button
          href={`/login?redirect=${encodeURIComponent(pathname)}`}
          appearance="primary"
          label="Login to comment"
          disabled={isLoading}
          className={classes.submit}
        />
      ) : (
        <Button
          type="submit"
          appearance="primary"
          label={isLoading ? 'Processing' : 'Comment'}
          disabled={isLoading}
          className={classes.submit}
        />
      )}
    </form>
  )
}
