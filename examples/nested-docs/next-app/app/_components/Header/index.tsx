import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { MainMenu } from '../../../payload-types'
import { CMSLink } from '../CMSLink'
import { Gutter } from '../Gutter'

import classes from './index.module.scss'

export async function Header() {
  const mainMenu: MainMenu = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/globals/main-menu`,
  ).then(res => res.json())

  const { navItems } = mainMenu

  const hasNavItems = navItems && Array.isArray(navItems) && navItems.length > 0

  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/" className={classes.logo}>
          <picture>
            <source
              srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/admin/assets/images/payload-logo-light.svg"
              media="(prefers-color-scheme: dark)"
            />
            <Image
              width={150}
              height={30}
              alt="Payload Logo"
              src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/admin/assets/images/payload-logo-dark.svg"
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
