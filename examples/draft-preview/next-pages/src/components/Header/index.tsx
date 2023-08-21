import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PayloadAdminBarProps, PayloadMeUser } from 'payload-admin-bar'

import { MainMenu } from '../../payload-types'
import { AdminBar } from '../AdminBar'
import { CMSLink } from '../CMSLink'
import { Gutter } from '../Gutter'

import classes from './index.module.scss'

type HeaderBarProps = {
  children?: React.ReactNode
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ children }) => {
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
        {children}
      </Gutter>
    </header>
  )
}

export const Header: React.FC<{
  globals: {
    mainMenu: MainMenu
  }
  adminBarProps: PayloadAdminBarProps
}> = props => {
  const { globals, adminBarProps } = props

  const [user, setUser] = useState<PayloadMeUser>()

  const {
    mainMenu: { navItems },
  } = globals

  const hasNavItems = navItems && Array.isArray(navItems) && navItems.length > 0

  return (
    <div>
      <AdminBar adminBarProps={adminBarProps} user={user} setUser={setUser} />
      <HeaderBar>
        {hasNavItems && (
          <nav className={classes.nav}>
            {navItems.map(({ link }, i) => {
              return <CMSLink key={i} {...link} />
            })}
          </nav>
        )}
      </HeaderBar>
    </div>
  )
}
