'use client'

import React from 'react'
import Link from 'next/link'

import { Header as HeaderType } from '../../../payload/payload-types'
import { useAuth } from '../../_providers/Auth'
import { CartLink } from '../CartLink'
import { Gutter } from '../Gutter'
import { CMSLink } from '../Link'

import classes from './index.module.scss'

export const Header: React.FC<{ header: HeaderType }> = ({ header }) => {
  const navItems = header?.navItems || []
  const { user } = useAuth()

  return (
    <>
      <header className={classes.header}>
        <Gutter className={classes.wrap}>
          <Link href="/">
            <picture>
              <source
                media="(prefers-color-scheme: dark)"
                srcSet="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/payload-logo-light.svg"
              />
              <img
                className={classes.logo}
                alt="Payload Logo"
                src="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/payload-logo-dark.svg"
              />
            </picture>
          </Link>
          <nav className={classes.nav}>
            {navItems.map(({ link }, i) => {
              return <CMSLink key={i} {...link} />
            })}
            {user && <Link href="/account">Account</Link>}
            {!user && (
              <React.Fragment>
                <Link href="/login">Login</Link>
                <Link href="/create-account">Create Account</Link>
              </React.Fragment>
            )}
            <CartLink />
          </nav>
        </Gutter>
      </header>
    </>
  )
}
