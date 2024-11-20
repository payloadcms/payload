import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { MainMenu } from '../../payload-types'

import { CMSLink } from '../CMSLink'
import { Gutter } from '../Gutter'
import classes from './index.module.scss'

export async function Header() {
  const mainMenu: MainMenu = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/globals/main-menu`,
  )
    .then((res) => res.json())
    .then((menu) => ({
      ...menu,
      navItems: menu.navItems.map((item) => ({
        ...item,
        link: {
          ...item.link,
          type: item.link.type ?? undefined,
          newTab: item.link.newTab ?? false,
          url: item.link.url ?? undefined,
        },
      })),
    }))

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
              const sanitizedLink = {
                ...link,
                type: link.type ?? undefined,
                newTab: link.newTab ?? false,
                url: link.url ?? undefined,
              }

              return <CMSLink key={i} {...sanitizedLink} />
            })}
          </nav>
        )}
      </Gutter>
    </header>
  )
}

export default Header
