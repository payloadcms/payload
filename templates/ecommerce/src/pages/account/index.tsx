import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { Button } from '../../components/Button'
import { Gutter } from '../../components/Gutter'
import { Input } from '../../components/Input'
import { getApolloClient } from '../../graphql'
import { HEADER_QUERY } from '../../graphql/globals'
import { useAuth } from '../../providers/Auth'
import classes from './index.module.css'

type FormData = {
  email: string
  name: string
}

const Account: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, setUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()

  const router = useRouter()

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
          // Make sure to include cookies with fetch
          credentials: 'include',
          method: 'PATCH',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const json = await response.json()

          // Update the user in auth state with new values
          setUser(json.doc)

          // Set success message for user
          setSuccess('Successfully updated account.')

          // Clear any existing errors
          setError('')
        } else {
          setError('There was a problem updating your account.')
        }
      }
    },
    [user, setUser],
  )

  useEffect(() => {
    if (user === null) {
      router.push(`/login?unauthorized=account`)
    }

    // Once user is loaded, reset form to have default values
    if (user) {
      reset({
        email: user.email,
        name: user.name,
      })
    }
  }, [user, router, reset])

  useEffect(() => {
    if (typeof router.query.success === 'string') {
      setSuccess(router.query.success)
    }
  }, [router])

  return (
    <Gutter className={classes.account}>
      <h1>Account</h1>
      {error && <div className={classes.error}>{error}</div>}
      {success && <div className={classes.success}>{success}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
        <Input
          name="email"
          label="Email Address"
          required
          register={register}
          error={errors.email}
        />
        <Input name="name" label="Name" required register={register} error={errors.name} />
        <Button type="submit" label="Update account" appearance="primary" />
      </form>
      <hr className={classes.hr} />
      <h2>Purchased Products</h2>
      <div>
        {user?.purchases?.length > 0 ? (
          user.purchases.map(purchase => {
            if (typeof purchase === 'string') {
              return (
                <div key={purchase}>
                  <h4>{purchase}</h4>
                </div>
              )
            }
            return (
              <Link key={purchase.id} href={`/products/${purchase.slug}`}>
                <h4>{purchase.title}</h4>
              </Link>
            )
          })
        ) : (
          <div>You have no purchases.</div>
        )}
      </div>
      <hr className={classes.hr} />
      <h2>Orders</h2>
      <Button
        className={classes.ordersButton}
        href="/orders"
        appearance="primary"
        label="View orders"
      />
      <hr className={classes.hr} />
      <Button href="/logout" appearance="secondary" label="Log out" />
    </Gutter>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const apolloClient = getApolloClient()

  const { data } = await apolloClient.query({
    query: HEADER_QUERY,
  })

  return {
    props: {
      header: data?.Header || null,
      footer: data?.Footer || null,
    },
  }
}

export default Account
