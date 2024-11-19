import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { MainMenu } from '../../../payload-types'

import { CMSLink } from '../CMSLink'
import { Gutter } from '../Gutter'
import classes from './index.module.scss'

export async function Header() {
  const mainMenu: MainMenu = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/globals/main-menu`,
  ).then((res) => res.json())

  const { navItems } = mainMenu

  const hasNavItems = navItems && Array.isArray(navItems) && navItems.length > 0

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
        {hasNavItems && (
          <nav className={classes.nav}>
            {navItems.map(({ link }, i) => {
              return <CMSLink key={i} {...link} />
            })}
          </nav>
        )}
      </Gutter>
    </header>
  )
}

export default Header
