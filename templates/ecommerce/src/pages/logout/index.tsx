import React, { Fragment, useEffect, useState } from 'react'
import { gql } from '@apollo/client'
import { GetStaticProps } from 'next'
import Link from 'next/link'

import { Gutter } from '../../components/Gutter'
import { getApolloClient } from '../../graphql'
import { FOOTER, HEADER, SETTINGS } from '../../graphql/globals'
import { Settings } from '../../payload-types'
import { useAuth } from '../../providers/Auth'

import classes from './index.module.scss'

const Logout: React.FC<{
  settings: Settings
}> = props => {
  const {
    settings: { shopPage },
  } = props
  const { logout } = useAuth()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
        setSuccess('Logged out successfully.')
      } catch (_) {
        setError('You are already logged out.')
      }
    }

    performLogout()
  }, [logout])

  return (
    <Gutter className={classes.logout}>
      {success && (
        <div>
          <h1>{success}</h1>
          <p>
            {'What would you like to do next? '}
            {typeof shopPage === 'object' && shopPage?.slug && (
              <Fragment>
                {' '}
                <Link href={`/${shopPage.slug}`}>Click here</Link>
                {` to shop.`}
              </Fragment>
            )}
            <Fragment>
              {' To log back in, '}
              <Link href={`/login?redirect=%2Fcart`}>click here</Link>
              {'.'}
            </Fragment>
          </p>
        </div>
      )}
      {error && <div className={classes.error}>{error}</div>}
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
      settings: data?.Settings || null,
    },
  }
}

export default Logout
