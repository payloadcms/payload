import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'

import { useAuth } from '../../components/Auth'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import classes from './index.module.css'

type FormData = {
  password: string
  token: string
}

const ResetPassword: React.FC = () => {
  const [error, setError] = useState('')
  const { login, resetPassword } = useAuth()
  const router = useRouter()

  const token = typeof router.query.token === 'string' ? router.query.token : undefined

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const user = await resetPassword(data as Parameters<typeof resetPassword>[0])

        if (user) {
          // Automatically log the user in after they successfully reset password
          // Then redirect them to /account with success message in URL
          await login({ email: user.email, password: data.password })
          router.push('/account?success=Password reset successfully.')
        }
      } catch (err) {
        setError(err?.message || 'An error occurred while attempting to reset password.')
      }
    },
    [router, login, resetPassword],
  )

  // When Next.js populates token within router, reset form with new token value
  useEffect(() => {
    reset({ token })
  }, [reset, token])

  return (
    <Gutter>
      <h1>Reset Password</h1>
      <p>Please enter a new password below.</p>
      {error && <div className={classes.error}>{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          name="password"
          type="password"
          label="New Password"
          required
          register={register}
          error={errors.password}
        />
        <input type="hidden" {...register('token')} />
        <button type="submit">Submit</button>
      </form>
    </Gutter>
  )
}

export default ResetPassword
