import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities/getPayloadHMR.js'
import LinkWithDefault from 'next/link.js'
import React from 'react'

import type { Header } from '../../../../payload-types.js'

import { Gutter } from '../Gutter/index.js'
import { HeaderNav } from './Nav/index.js'
import classes from './index.module.scss'

const Link = (LinkWithDefault.default || LinkWithDefault) as typeof LinkWithDefault.default

export async function Header() {
  const payload = await getPayloadHMR({ config })

  const header = await payload.findGlobal({
    slug: 'header',
  })

  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/live-preview">
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
