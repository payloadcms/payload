'use client'

import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'

import { User } from '../../../payload-types'
import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { Input } from '../../_components/Input'
import { useAuth } from '../../_providers/Auth'
import classes from './index.module.css'

type FormData = Partial<
  User & {
    password: string
    passwordConfirm: string
  }
>

const CreateAccount: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Automatically log the user in
        await login({ email: data.email || '', password: data.password || '' })

        // Set success message for user
        setSuccess(true)

        // Clear any existing errors
        setError('')
      } else {
        setError('There was a problem creating your account. Please try again later.')
      }
    },
    [login],
  )

  return (
    <Gutter className={classes.createAccount}>
      {!success && (
        <React.Fragment>
          <h1>Create Account</h1>
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
            <Input
              name="passwordConfirm"
              type="password"
              label="Confirm Password"
              required
              register={register}
              error={errors.passwordConfirm}
            />
            <Input name="name" label="Name" required register={register} error={errors.name} />
            <Button type="submit" label="Create account" appearance="primary" />
          </form>
          <Fragment>
            {'Already have an account? '}
            <Link href="/login">Login</Link>
          </Fragment>
        </React.Fragment>
      )}
      {success && (
        <React.Fragment>
          <h1>Account created successfully</h1>
          <p>You are now logged in.</p>
          <Link href="/account">Go to your account</Link>
        </React.Fragment>
      )}
    </Gutter>
  )
}

export default CreateAccount
