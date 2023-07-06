import React, { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useAuth } from '../Auth'
import { Gutter } from '../Gutter'

import classes from './index.module.scss'

export const Header: React.FC = () => {
  const { user } = useAuth()

  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/" className={classes.logo}>
          <picture>
            <source
              srcSet="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/payload-logo-light.svg"
              media="(prefers-color-scheme: dark)"
            />
            <Image
              width={150}
              height={30}
              alt="Payload Logo"
              src="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/payload-logo-dark.svg"
            />
          </picture>
        </Link>
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
      </Gutter>
    </header>
  )
}

export default Header
