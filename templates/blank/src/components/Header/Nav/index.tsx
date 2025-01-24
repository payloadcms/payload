'use client'

import Link from 'next/link'
import React from 'react'

import type { User } from '@/payload-types'
import classes from './index.module.scss'

type HeaderNavProps = {
  user:
    | (User & {
        collection: 'users'
      })
    | null
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ user }) => {
  return (
    <nav
      className={[
        classes.nav,
        // fade the nav in on user load to avoid flash of content and layout shift
        // Vercel also does this in their own website header, see https://vercel.com
        user === undefined && classes.hide,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {user && (
        <React.Fragment>
          <Link href="/admin/logout" rel="noopener noreferrer" target="_blank">
            Logout
          </Link>
        </React.Fragment>
      )}
      {!user && (
        <React.Fragment>
          <Link href="/admin/login" rel="noopener noreferrer" target="_blank">
            Login
          </Link>
        </React.Fragment>
      )}
    </nav>
  )
}
