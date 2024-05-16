import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import type { Header } from '../../../payload-types'

import { Gutter } from '../Gutter'
import { Logo } from '../Logo/Logo'
import { HeaderNav } from './Nav'
import classes from './index.module.scss'

export async function Header() {
  const payload = await getPayload({ config: configPromise })
  const header = await payload.findGlobal({
    slug: 'header',
  })

  return (
    <React.Fragment>
      <header className={classes.header}>
        <Gutter className={classes.wrap}>
          <Link href="/">
            <Logo />
          </Link>
          <HeaderNav header={header} />
        </Gutter>
      </header>
    </React.Fragment>
  )
}
