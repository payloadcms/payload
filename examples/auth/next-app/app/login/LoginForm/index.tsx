'use client'

import React, { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '../../_components/Button'
import { Input } from '../../_components/Input'
import { Message } from '../../_components/Message'
import { useAuth } from '../../_providers/Auth'

import classes from './index.module.scss'

type FormData = {
  email: string
  password: string
}

export const LoginForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const redirect = useRef(searchParams.get('redirect'))
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
  } = useForm<FormData>({
    defaultValues: {
      email: 'demo@payloadcms.com',
      password: 'demo',
    },
  })

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await login(data)
        if (redirect?.current) router.push(redirect.current as string)
        else router.push('/account')
      } catch (_) {
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
      <p>
        {'To log in, use the email '}
        <b>demo@payloadcms.com</b>
        {' with the password '}
        <b>demo</b>
        {'. To manage your users, '}
        <Link href={`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/admin/collections/users`}>
          login to the admin dashboard
        </Link>
        .
      </p>
      <Message error={error} className={classes.message} />
      <Input
        name="email"
        label="Email Address"
        required
        register={register}
        error={errors.email}
        type="email"
      />
      <Input
        name="password"
        type="password"
        label="Password"
        required
        register={register}
        error={errors.password}
      />
      <Button
        type="submit"
        disabled={isLoading}
        className={classes.submit}
        label={isLoading ? 'Processing' : 'Login'}
        appearance="primary"
      />
      <div>
        <Link href={`/create-account${allParams}`}>Create an account</Link>
        <br />
        <Link href={`/recover-password${allParams}`}>Recover your password</Link>
      </div>
    </form>
  )
}
