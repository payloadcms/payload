'use client'

import Link from 'next/link'
import React, { Fragment, useEffect, useState } from 'react'

import { useAuth } from '../../_providers/Auth'

export const LogoutPage: React.FC = () => {
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

    void performLogout()
  }, [logout])

  return (
    <Fragment>
      {(error || success) && (
        <div>
          <h1>{error || success}</h1>
          <p>
            {'What would you like to do next? '}
            <Link href="/">Click here</Link>
            {` to go to the home page. To log back in, `}
            <Link href="/login">click here</Link>.
          </p>
        </div>
      )}
    </Fragment>
  )
}
