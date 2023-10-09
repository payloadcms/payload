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

  const hasPostsPage = typeof postsPage === 'object' && postsPage?.slug
  const hasProjectsPage = typeof projectsPage === 'object' && projectsPage?.slug

  return (
    <Fragment>
      {(error || success) && (
        <div>
          <h1>{error || success}</h1>
          <p>
            {'What would you like to do next? '}
            {hasPostsPage && hasProjectsPage && <Fragment>{'Browse '}</Fragment>}
            {hasPostsPage && (
              <Fragment>
                <Link href={`/${postsPage.slug}`}>all posts</Link>
              </Fragment>
            )}
            {hasPostsPage && hasProjectsPage && <Fragment>{' or '}</Fragment>}
            {hasProjectsPage && (
              <Fragment>
                <Link href={`/${projectsPage.slug}`}>all projects</Link>
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
