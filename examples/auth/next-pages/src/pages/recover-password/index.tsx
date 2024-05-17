import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'

import { Button } from '../../components/Button'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import { Message } from '../../components/Message'

import classes from './index.module.scss'

type FormData = {
  email: string
}

const RecoverPassword: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = useCallback(async (data: FormData) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/users/forgot-password`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response.ok) {
      setSuccess(true)
      setError('')
    } else {
      setError(
        'There was a problem while attempting to send you a password reset email. Please try again.',
      )
    }
  }, [])

  return (
    <Gutter className={classes.recoverPassword}>
      {!success && (
        <React.Fragment>
          <h1>Recover Password</h1>
          <div className={classes.formWrapper}>
            <p>
              {`Please enter your email below. You will receive an email message with instructions on
              how to reset your password. To manage all of your users, `}
              <Link href={`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/admin/collections/users`}>
                login to the admin dashboard
              </Link>
              {'.'}
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
              <Message error={error} className={classes.message} />
              <Input
                name="email"
                label="Email Address"
                required
                register={register}
                error={errors.email}
                type="email"
              />
              <Button
                type="submit"
                className={classes.submit}
                label="Recover Password"
                appearance="primary"
              />
            </form>
          </div>
        </React.Fragment>
      )}
      {success && (
        <React.Fragment>
          <h1>Request submitted</h1>
          <p>Check your email for a link that will allow you to securely reset your password.</p>
        </React.Fragment>
      )}
    </Gutter>
  )
}

export default RecoverPassword
