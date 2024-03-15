{
  /* eslint-disable @next/next/no-img-element */
}

import { fetchHeader } from '@/app/_api/fetchHeader'
import Link from 'next/link'
import React from 'react'

import { Gutter } from '../Gutter'
import { HeaderNav } from './Nav'
import classes from './index.module.scss'

export async function Header() {
  const header = await fetchHeader()

  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/">
          <img
            alt="Payload Logo"
            className={classes.logo}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/admin/assets/images/payload-logo-dark.svg"
          />
        </Link>
        <HeaderNav header={header} />
      </Gutter>
    </header>
  )
}
