import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'

import { Button } from '../../components/Button'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import { Message } from '../../components/Message'
import { useAuth } from '../../providers/Auth'

import classes from './index.module.scss'

type FormData = {
  password: string
  token: string
}

const ResetPassword: React.FC = () => {
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useMemo(() => new URLSearchParams(router.query as any), [router.query])
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/users/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.ok) {
        const json = await response.json()

        // Automatically log the user in after they successfully reset password
        await login({ email: json.user.email, password: data.password })

        // Redirect them to `/account` with success message in URL
        router.push('/account?success=Password reset successfully.')
      } else {
        setError('There was a problem while resetting your password. Please try again later.')
      }
    },
    [router, login],
  )

  // when Next.js populates token within router,
  // reset form with new token value
  useEffect(() => {
    reset({ token: token || undefined })
  }, [reset, token])

  return (
    <Gutter className={classes.resetPassword}>
      <h1>Reset Password</h1>
      <p>Please enter a new password below.</p>
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
        <Message error={error} className={classes.message} />
        <Input
          name="password"
          type="password"
          label="New Password"
          required
          register={register}
          error={errors.password}
        />
        <input type="hidden" {...register('token')} />
        <Button
          type="submit"
          className={classes.submit}
          label="Reset Password"
          appearance="primary"
        />
      </form>
    </Gutter>
  )
}

export default ResetPassword
