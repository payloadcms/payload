import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { MainMenu } from '../../payload-types'

import { getCachedGlobal } from '../../utilities/getGlobals'
import { CMSLink } from '../CMSLink'
import { Gutter } from '../Gutter'
import classes from './index.module.scss'

export async function Header() {
  const header: MainMenu = await getCachedGlobal('main-menu', 1)()

  const navItems = header?.navItems || []

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
      </Gutter>
    </header>
  )
}

export default Header
