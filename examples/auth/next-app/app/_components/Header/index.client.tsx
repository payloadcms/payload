'use client'

import React, { Fragment } from 'react'
import Link from 'next/link'

import { useAuth } from '../Auth'

import classes from './index.module.scss'

export function HeaderClient() {
  const { user } = useAuth()

  return (
    <nav className={classes.nav}>
      {!user && (
        <Fragment>
          <Link href="/login">Login</Link>
          <Link href="/create-account">Create Account</Link>
        </Fragment>
      )}
      {user && (
        <Fragment>
          <Link href="/account">Account</Link>
          <Link href="/logout">Logout</Link>
        </Fragment>
      )}
    </nav>
  )
}

export default HeaderClient
