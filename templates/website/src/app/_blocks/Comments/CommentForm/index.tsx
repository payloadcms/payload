'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { Fragment, useCallback } from 'react'
import { useForm } from 'react-hook-form'

import type { Comment } from '../../../../payload/payload-types'

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
  const [error, setError] = React.useState<null | string>(null)
  const [success, setSuccess] = React.useState<React.ReactNode | null>(null)

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
    reset,
  } = useForm<FormData>()

  const { user } = useAuth()

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!user) return

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/comments`, {
          body: JSON.stringify({
            // All comments are created as drafts so that they can be moderated before being published
            // Navigate to the admin dashboard and change the comment status to "published" for it to appear on the site
            doc: docID,
            status: 'draft',
            user: user.id,
            ...data,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
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
    <form className={classes.form} onSubmit={handleSubmit(onSubmit)}>
      <Message className={classes.message} error={error} success={success} />
      <Input
        disabled={!user}
        error={errors.comment}
        label="Comment"
        name="comment"
        placeholder={user ? 'Leave a comment' : 'Login to leave a comment'}
        register={register}
        required
        type="textarea"
        validate={(value) => {
          if (!value) return 'Please enter a comment'
          if (value.length < 3) return 'Please enter a comment over 3 characters'
          if (value.length > 500) return 'Please enter a comment under 500 characters'
          return true
        }}
      />
      {!user ? (
        <Button
          appearance="primary"
          className={classes.submit}
          disabled={isLoading}
          href={`/login?redirect=${encodeURIComponent(pathname)}`}
          label="Login to comment"
        />
      ) : (
        <Button
          appearance="primary"
          className={classes.submit}
          disabled={isLoading}
          label={isLoading ? 'Processing' : 'Comment'}
          type="submit"
        />
      )}
    </form>
  )
}
