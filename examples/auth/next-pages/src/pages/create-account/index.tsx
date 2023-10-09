import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { Button } from '../../components/Button'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import { Message } from '../../components/Message'
import { RenderParams } from '../../components/RenderParams'
import { useAuth } from '../../providers/Auth'

import classes from './index.module.scss'

type FormData = {
  email: string
  password: string
  passwordConfirm: string
}

const CreateAccount: React.FC = () => {
  const router = useRouter()
  const searchParams = useMemo(() => new URLSearchParams(router.query as any), [router.query])
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/users`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
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
        if (redirect) router.push(redirect as string)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (_) {
        clearTimeout(timer)
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router, searchParams],
  )

  return (
    <Gutter className={classes.createAccount}>
      <h1>Create Account</h1>
      <RenderParams />
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
        <p>
          {`This is where new customers can signup and create a new account. To manage all users, `}
          <Link href={`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/admin/collections/users`}>
            login to the admin dashboard
          </Link>
          {'.'}
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
        <Input
          name="passwordConfirm"
          type="password"
          label="Confirm Password"
          required
          register={register}
          validate={value => value === password.current || 'The passwords do not match'}
          error={errors.passwordConfirm}
        />
        <Button
          type="submit"
          className={classes.submit}
          label={loading ? 'Processing' : 'Create Account'}
          appearance="primary"
        />
        <div>
          {'Already have an account? '}
          <Link href={`/login${allParams}`}>Login</Link>
        </div>
      </form>
    </Gutter>
  )
}

export default CreateAccount
