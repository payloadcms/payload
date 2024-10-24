'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from '@/payload-types'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  name: User['name']
  password: string
  passwordConfirm: string
}

export const AccountForm: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { setUser, user } = useAuth()
  const [changePassword, setChangePassword] = useState(false)

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const router = useRouter()

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
          // Make sure to include cookies with fetch
          body: JSON.stringify(data),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        })

        if (response.ok) {
          const json = await response.json()
          setUser(json.doc)
          setSuccess('Successfully updated account.')
          setError('')
          setChangePassword(false)
          reset({
            name: json.doc.name,
            email: json.doc.email,
            password: '',
            passwordConfirm: '',
          })
        } else {
          setError('There was a problem updating your account.')
        }
      }
    },
    [user, setUser, reset],
  )

  useEffect(() => {
    if (user === null) {
      router.push(
        `/login?error=${encodeURIComponent(
          'You must be logged in to view this page.',
        )}&redirect=${encodeURIComponent('/account')}`,
      )
    }

    // Once user is loaded, reset form to have default values
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
        passwordConfirm: '',
      })
    }
  }, [user, router, reset, changePassword])

  return (
    <form className="max-w-xl" onSubmit={handleSubmit(onSubmit)}>
      <Message className="" error={error} success={success} />
      {!changePassword ? (
        <Fragment>
          <div className="prose dark:prose-invert mb-8">
            <p className="">
              {'Change your account details below, or '}
              <Button
                className="px-0 text-inherit underline"
                onClick={() => setChangePassword(!changePassword)}
                type="button"
                variant="link"
              >
                click here
              </Button>
              {' to change your password.'}
            </p>
          </div>
          <div className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" {...register('email', { required: true })} required type="email" />
          </div>
          <div className="mb-8">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name', { required: true })} required type="text" />
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className="prose dark:prose-invert mb-8">
            <p>
              {'Change your password below, or '}
              <Button
                className="px-0 text-inherit underline"
                onClick={() => setChangePassword(!changePassword)}
                type="button"
                variant="link"
              >
                cancel
              </Button>
              .
            </p>
          </div>
          <div className="mb-4">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              {...register('password', { required: true })}
              required
              type="password"
            />
          </div>

          <div className="mb-8">
            <Label htmlFor="passwordConfirm">Confirm password</Label>
            <Input
              id="passwordConfirm"
              {...register('passwordConfirm', {
                required: true,
                validate: (value) => value === password.current || 'The passwords do not match',
              })}
              required
              type="password"
            />
          </div>
        </Fragment>
      )}
      <Button disabled={isLoading} type="submit" variant="default">
        {isLoading ? 'Processing' : changePassword ? 'Change Password' : 'Update Account'}
      </Button>
    </form>
  )
}
