import React, { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'

import { useAuth } from '../../components/Auth'
import { Gutter } from '../../components/Gutter'
import classes from './index.module.css'

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
    <Gutter>
      {success && <h1>{success}</h1>}
      {error && <div className={classes.error}>{error}</div>}
      <p>
        {'What would you like to do next? '}
        <Fragment>
          {' To log back in, '}
          <Link href={`/login`}>click here</Link>
          {'.'}
        </Fragment>
      </p>
    </Gutter>
  )
}

export default Logout
