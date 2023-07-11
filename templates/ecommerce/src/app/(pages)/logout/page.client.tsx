'use client'

import React, { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'

import { Settings } from '../../../payload-types'
import { Gutter } from '../../_components/Gutter'
import { useAuth } from '../../_providers/Auth'

import classes from './index.module.scss'

export const LogoutPageClient: React.FC<{
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
