'use client'

import { useRouter } from 'next/navigation'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '../../_components/Button'
import { Input } from '../../_components/Input'
import { Message } from '../../_components/Message'
import { useAuth } from '../../_providers/Auth'
import classes from './index.module.scss'

type FormData = {
  email: string
  name: string
  password: string
  passwordConfirm: string
}

export const AccountForm: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { setUser, user } = useAuth()
  const [changePassword, setChangePassword] = useState(false)
  const router = useRouter()

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

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
      router.push(`/login?unauthorized=account`)
    }

    // Once user is loaded, reset form to have default values
    if (user) {
      reset({
        email: user.email,
        password: '',
        passwordConfirm: '',
      })
    }
  }, [user, router, reset, changePassword])

  return (
    <form className={classes.form} onSubmit={handleSubmit(onSubmit)}>
      <Message className={classes.message} error={error} success={success} />
      {!changePassword ? (
        <Fragment>
          <p>
            {'To change your password, '}
            <button
              className={classes.changePassword}
              onClick={() => setChangePassword(!changePassword)}
              type="button"
            >
              click here
            </button>
            .
          </p>
          <Input
            error={errors.email}
            label="Email Address"
            name="email"
            register={register}
            required
            type="email"
          />
        </Fragment>
      ) : (
        <Fragment>
          <p>
            {'Change your password below, or '}
            <button
              className={classes.changePassword}
              onClick={() => setChangePassword(!changePassword)}
              type="button"
            >
              cancel
            </button>
            .
          </p>
          <Input
            error={errors.password}
            label="Password"
            name="password"
            register={register}
            required
            type="password"
          />
          <Input
            error={errors.passwordConfirm}
            label="Confirm Password"
            name="passwordConfirm"
            register={register}
            required
            type="password"
            validate={(value) => value === password.current || 'The passwords do not match'}
          />
        </Fragment>
      )}
      <Button
        appearance="primary"
        className={classes.submit}
        label={isLoading ? 'Processing' : changePassword ? 'Change password' : 'Update account'}
        type="submit"
      />
    </form>
  )
}
