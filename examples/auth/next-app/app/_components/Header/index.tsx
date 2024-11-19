import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Gutter } from '../Gutter'
import classes from './index.module.scss'
import { HeaderNav } from './Nav'

export function Header() {
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
        <HeaderNav />
      </Gutter>
    </header>
  )
}

export default Header
