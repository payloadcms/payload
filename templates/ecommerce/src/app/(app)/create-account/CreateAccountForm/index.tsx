'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
  passwordConfirm: string
}

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users`, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = response.statusText || 'There was an error creating the account.'
        setError(message)
        return
      }

      const redirect = searchParams.get('redirect')

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        await login(data)
        clearTimeout(timer)
        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (_) {
        clearTimeout(timer)
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router, searchParams],
  )

  return (
    <form className="max-w-lg py-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="prose dark:prose-invert mb-6">
        <p>
          {`This is where new customers can signup and create a new account. To manage all users, `}
          <Link href="/admin/collections/users">login to the admin dashboard</Link>.
        </p>
      </div>
      <Message className="classes.message" error={error} />

      <div className="mb-4">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" {...register('email', { required: true })} required type="email" />
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

      <div className="mb-4">
        <Label htmlFor="passwordConfirm">Confirm Password</Label>
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
      <Button disabled={loading} type="submit" variant="default">
        {loading ? 'Processing' : 'Create Account'}
      </Button>

      <div className="prose dark:prose-invert mt-8">
        <p>
          {'Already have an account? '}
          <Link href={`/login${allParams}`}>Login</Link>
        </p>
      </div>
    </form>
  )
}
