import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { MainMenu } from '../../payload-types'
import { CMSLink } from '../CMSLink'
import { Gutter } from '../Gutter'

import classes from './index.module.scss'

export async function Header() {
  const mainMenu: MainMenu = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/globals/main-menu`,
  ).then(res => res.json())

  const { navItems } = mainMenu

  const hasNavItems = navItems && Array.isArray(navItems) && navItems.length > 0

  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/" className={classes.logo}>
          <Image
            width={150}
            height={30}
            alt="payload cms logo"
            src="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/payload-logo-dark.svg"
          />
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
