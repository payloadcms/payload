'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { redirect, useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '../_components/Auth'
import { Gutter } from '../_components/Gutter'
import { Input } from '../_components/Input'
import classes from './index.module.css'

type FormData = {
  email: string
  password: string
}

const Login: React.FC = () => {
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useSearchParams()
  const { login, user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await login(data)
        router.push('/account')
      } catch (err: any) {
        setError(err?.message || 'An error occurred while attempting to login.')
      }
    },
    [login, router],
  )

  useEffect(() => {
    const unauthorized = params.get('unauthorized')
    if (unauthorized) {
      setError(`To visit the ${unauthorized} page, you need to be logged in.`)
    }
  }, [params])

  if (user) {
    redirect('/account')
  }

  return (
    <Gutter>
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
        <input type="submit" />
      </form>
      <Link href="/create-account">Create an account</Link>
      <br />
      <Link href="/recover-password">Recover your password</Link>
    </Gutter>
  )
}

export default Login
