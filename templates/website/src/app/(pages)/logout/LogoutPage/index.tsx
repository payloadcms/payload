'use client'

import React, { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'

import { Settings } from '../../../../payload/payload-types'
import { useAuth } from '../../../_providers/Auth'

export const LogoutPage: React.FC<{
  settings: Settings
}> = props => {
  const { settings } = props
  const { postsPage, projectsPage } = settings || {}
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
      {(error || success) && (
        <div>
          <h1>{error || success}</h1>
          <p>
            {'What would you like to do next? '}
            {typeof postsPage === 'object' && postsPage?.slug && (
              <Fragment>
                <Link href={`/${postsPage.slug}`}>Click here</Link>
                {` to see all posts, or `}
              </Fragment>
            )}
            {typeof projectsPage === 'object' && projectsPage?.slug && (
              <Fragment>
                <Link href={`/${projectsPage.slug}`}>click here</Link>
                {` to see all projects.`}
              </Fragment>
            )}
            {` To log back in, `}
            <Link href="/login">click here</Link>
            {'.'}
          </p>
        </div>
      )}
    </Fragment>
  )
}
