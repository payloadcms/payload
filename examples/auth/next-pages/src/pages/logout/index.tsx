import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import { Gutter } from '../../components/Gutter'
import { useAuth } from '../../providers/Auth'

import classes from './index.module.scss'

const Logout: React.FC = () => {
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
      {(error || success) && (
        <div>
          <h1>{error || success}</h1>
          <p>
            {'What would you like to do next? '}
            <Link href="/">Click here</Link>
            {` to go to the home page. To log back in, `}
            <Link href="/login">click here</Link>
            {'.'}
          </p>
        </div>
      )}
    </Gutter>
  )
}

export default Logout
