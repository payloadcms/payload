'use client'

import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { usePathname } from 'next/navigation'

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
  const [success, setSuccess] = React.useState<string | null>(null)

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

        if (!res.ok) throw new Error((await res.json()).message)

        setError(null)
        setSuccess(
          'Your comment submitted for moderation successfully. Navigate to the admin dashboard to approve it.',
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
