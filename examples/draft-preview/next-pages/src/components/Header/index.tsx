import type { PayloadAdminBarProps, PayloadMeUser } from 'payload-admin-bar'

import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

import type { MainMenu } from '../../payload-types'

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
        <Link className={classes.logo} href="/">
          <picture>
            <source
              media="(prefers-color-scheme: dark)"
              srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-logo-light.svg"
            />
            <Image
              alt="Payload Logo"
              height={30}
              src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-logo-dark.svg"
              width={150}
            />
          </picture>
        </Link>
        {children}
      </Gutter>
    </header>
  )
}

export const Header: React.FC<{
  adminBarProps: PayloadAdminBarProps
  globals: {
    mainMenu: MainMenu
  }
}> = (props) => {
  const { adminBarProps, globals } = props

  const [user, setUser] = useState<PayloadMeUser>()

  const {
    mainMenu: { navItems },
  } = globals

  const hasNavItems = navItems && Array.isArray(navItems) && navItems.length > 0

  return (
    <div>
      <AdminBar adminBarProps={adminBarProps} setUser={setUser} user={user} />
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
