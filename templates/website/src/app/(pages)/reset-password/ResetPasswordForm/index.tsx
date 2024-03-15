'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '../../../_components/Button'
import { Input } from '../../../_components/Input'
import { Message } from '../../../_components/Message'
import { useAuth } from '../../../_providers/Auth'
import classes from './index.module.scss'

type FormData = {
  password: string
  token: string
}

export const ResetPasswordForm: React.FC = () => {
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/reset-password`,
        {
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
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
    <form className={classes.form} onSubmit={handleSubmit(onSubmit)}>
      <Message className={classes.message} error={error} />
      <Input
        error={errors.password}
        label="New Password"
        name="password"
        register={register}
        required
        type="password"
      />
      <input type="hidden" {...register('token')} />
      <Button
        appearance="primary"
        className={classes.submit}
        label="Reset Password"
        type="submit"
      />
    </form>
  )
}
