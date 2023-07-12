'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { Input } from '../../_components/Input'
import { useAuth } from '../../_providers/Auth'

import classes from './index.module.scss'

type FormData = {
  email: string
  password: string
}

const Login: React.FC = () => {
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      const redirect = searchParams.get('redirect')

      try {
        await login(data)
        if (redirect) router.push(redirect as string)
        else router.push('/account')
      } catch (_) {
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router, searchParams],
  )

  useEffect(() => {
    const unauthorized = searchParams.get('unauthorized')

    if (unauthorized) {
      setError(`To visit the ${unauthorized} page, you need to be logged in.`)
    }
  }, [router, searchParams])

  return (
    <Gutter className={classes.login}>
      <h1>Log in</h1>
      <p>
        To log in, use the email <b>demo@payloadcms.com</b> with the password <b>demo</b>.
      </p>
      {error && <div className={classes.error}>{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
        <Input
          name="email"
          label="Email Address"
          required
          register={register}
          error={errors.email}
        />
        <Input
          name="password"
          type="password"
          label="Password"
          required
          register={register}
          error={errors.password}
        />
        <Button type="submit" appearance="primary" label="Login" className={classes.submit} />
      </form>
      <Link href="/create-account">Create an account</Link>
      <br />
      <Link href="/recover-password">Recover your password</Link>
    </Gutter>
  )
}

export default Login
