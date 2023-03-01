import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'

import { useAuth } from '../../components/Auth'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import classes from './index.module.css'

type FormData = {
  email: string
  password: string
  firstName: string
  lastName: string
}

const CreateAccount: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { login, create, user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await create(data as Parameters<typeof create>[0])
        // Automatically log the user in after creating their account
        await login({ email: data.email, password: data.password })
        setSuccess(true)
      } catch (err) {
        setError(err?.message || 'An error occurred while attempting to create your account.')
      }
    },
    [login, create],
  )

  return (
    <Gutter>
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
              name="firstName"
              label="First Name"
              register={register}
              error={errors.firstName}
            />
            <Input name="lastName" label="Last Name" register={register} error={errors.lastName} />
            <button type="submit">Create account</button>
          </form>
          <p>
            {'Already have an account? '}
            <Link href="/login">Login</Link>
          </p>
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
