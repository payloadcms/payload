import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
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
  name: string
  password: string
  passwordConfirm: string
}

const Account: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, setUser } = useAuth()
  const [changePassword, setChangePassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
    reset,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (user) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/users/${user.id}`,
          {
            // Make sure to include cookies with fetch
            credentials: 'include',
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )

        if (response.ok) {
          const json = await response.json()
          setUser(json.doc)
          setSuccess('Successfully updated account.')
          setError('')
          setChangePassword(false)
          reset({
            email: json.doc.email,
            name: json.doc.name,
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
    <Gutter className={classes.account}>
      <RenderParams className={classes.params} />
      <h1>Account</h1>
      <p>
        {`This is your account dashboard. Here you can update your account information and more. To manage all users, `}
        <Link href={`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/admin/collections/users`}>
          login to the admin dashboard
        </Link>
        {'.'}
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
        <Message error={error} success={success} className={classes.message} />
        {!changePassword ? (
          <Fragment>
            <p>
              {'Change your account details below, or '}
              <button
                type="button"
                className={classes.changePassword}
                onClick={() => setChangePassword(!changePassword)}
              >
                click here
              </button>
              {' to change your password.'}
            </p>
            <Input
              name="email"
              label="Email Address"
              required
              register={register}
              error={errors.email}
              type="email"
            />
          </Fragment>
        ) : (
          <Fragment>
            <p>
              {'Change your password below, or '}
              <button
                type="button"
                className={classes.changePassword}
                onClick={() => setChangePassword(!changePassword)}
              >
                cancel
              </button>
              .
            </p>
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
          </Fragment>
        )}
        <Button
          type="submit"
          className={classes.submit}
          label={isLoading ? 'Processing' : changePassword ? 'Change password' : 'Update account'}
          appearance="primary"
        />
      </form>
      <Button href="/logout" appearance="secondary" label="Log out" />
    </Gutter>
  )
}

export default Account
