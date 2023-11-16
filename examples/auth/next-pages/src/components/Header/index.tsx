import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { Gutter } from '../Gutter'
import { HeaderNav } from './Nav'

import classes from './index.module.scss'

export const Header: React.FC = () => {
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
        <HeaderNav />
      </Gutter>
    </header>
  )
}

export default Header
