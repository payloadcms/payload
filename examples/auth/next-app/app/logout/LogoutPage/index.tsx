'use client'

import React, { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'

import { useAuth } from '../../_providers/Auth'

export const LogoutPage: React.FC = props => {
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
    <Fragment>
      {error && <h1>{error}</h1>}
      {success && (
        <div>
          <h1>{success}</h1>
          <p>
            {'What would you like to do next? '}
            <Link href="/">Click here</Link>
            {` to go home. To log back in, `}
            <Link href="login">click here</Link>
            {'.'}
          </p>
        </div>
      )}
    </Fragment>
  )
}
