import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useAuth } from '../../components/Auth'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import classes from './index.module.css'

type FormData = {
  email: string
}

const RecoverPassword: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { forgotPassword } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const user = await forgotPassword(data as Parameters<typeof forgotPassword>[0])

        if (user) {
          setSuccess(true)
          setError('')
        }
      } catch (err) {
        setError(err?.message || 'An error occurred while attempting to recover password.')
      }
    },
    [forgotPassword],
  )

  return (
    <Gutter>
      {!success && (
        <React.Fragment>
          <h1>Recover Password</h1>
          <p>
            Please enter your email below. You will receive an email message with instructions on
            how to reset your password.
          </p>
          {error && <div className={classes.error}>{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              name="email"
              label="Email Address"
              required
              register={register}
              error={errors.email}
            />
            <button type="submit">Submit</button>
          </form>
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
