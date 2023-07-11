import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { gql } from '@apollo/client'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { Button } from '../../components/Button'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import { getApolloClient } from '../../graphql'
import { FOOTER, HEADER } from '../../graphql/globals'
import { useAuth } from '../../providers/Auth'

import classes from './index.module.scss'

type FormData = {
  email: string
  password: string
}

const Login: React.FC = () => {
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await login(data)
        if (router.query.redirect) router.push(router.query.redirect as string)
        else router.push('/account')
      } catch (_) {
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router],
  )

  useEffect(() => {
    if (router.query.unauthorized) {
      setError(`To visit the ${router.query.unauthorized} page, you need to be logged in.`)
    }
  }, [router])

  return (
    <Gutter className={classes.login}>
      <h1>Log in</h1>
      <p>
        To log in, use the email <b>dev@payloadcms.com</b> with the password <b>test</b>.
      </p>
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
        <Button type="submit" appearance="primary" label="Login" />
      </form>
      <Link href="/create-account">Create an account</Link>
      <br />
      <Link href="/recover-password">Recover your password</Link>
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

export default Login
