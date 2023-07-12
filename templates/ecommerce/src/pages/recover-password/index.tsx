import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { gql } from '@apollo/client'
import { GetStaticProps } from 'next'

import { Button } from '../../components/Button'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import { getApolloClient } from '../../graphql'
import { FOOTER, HEADER, SETTINGS } from '../../graphql/globals'

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
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/forgot-password`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response.ok) {
      // Set success message for user
      setSuccess(true)

      // Clear any existing errors
      setError('')
    } else {
      setError(
        'There was a problem while attempting to send you a password reset email. Please try again later.',
      )
    }
  }, [])

  return (
    <Gutter className={classes.recoverPassword}>
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
            <Button type="submit" appearance="primary" label="Submit" />
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

export const getStaticProps: GetStaticProps = async () => {
  const apolloClient = getApolloClient()

  const { data } = await apolloClient.query({
    query: gql(`
      query {
        ${HEADER}
        ${FOOTER}
        ${SETTINGS}
      }
    `),
  })

  return {
    props: {
      header: data?.Header || null,
      footer: data?.Footer || null,
    },
  }
}

export default RecoverPassword
