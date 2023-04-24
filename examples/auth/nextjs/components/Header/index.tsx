import React, { Fragment } from 'react'
import Link from 'next/link'

import { useAuth } from '../Auth'
import { Gutter } from '../Gutter'
import { Logo } from '../Logo'

import classes from './index.module.scss'

type HeaderBarProps = {
  children?: React.ReactNode
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ children }) => {
  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/">
          <Logo />
        </Link>
        {children}
      </Gutter>
    </header>
  )
}

export const Header = () => {
  const { user } = useAuth()

  return (
    <div>
      <HeaderBar>
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
      </HeaderBar>
    </div>
  )
}
