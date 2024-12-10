import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '../../../../payload.config'
import { CMSLink } from '../CMSLink'
import { Gutter } from '../Gutter'
import classes from './index.module.scss'

export const Header = async () => {
  const payload = await getPayload({ config })

  const mainMenu = await payload.findGlobal({
    slug: 'main-menu',
    depth: 1,
  })

  const { navItems } = mainMenu

  const hasNavItems = navItems && Array.isArray(navItems) && navItems.length > 0

  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link className={classes.logo} href="/">
          <picture>
            <source
              media="(prefers-color-scheme: dark)"
              srcSet="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/payload-logo-light.svg"
            />
            <Image
              alt="Payload Logo"
              height={30}
              src="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/payload-logo-dark.svg"
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
