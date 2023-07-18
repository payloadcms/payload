import React, { Fragment } from 'react'
import { Metadata } from 'next'

import { Page } from '../../../payload/payload-types'
import { fetchDoc } from '../../_api/fetchDoc'
import { fetchGlobals } from '../../_api/fetchGlobals'
import { Blocks } from '../../_components/Blocks'
import { Gutter } from '../../_components/Gutter'
import { Hero } from '../../_components/Hero'
import { generateMeta } from '../../_utilities/generateMeta'
import { CartPage } from './CartPage'

export default async function Cart() {
  const { settings } = await fetchGlobals()

  const page = await fetchDoc<Page>({
    collection: 'pages',
    slug: 'cart',
  })

  return (
    <Fragment>
      <Hero {...page?.hero} />
      <Gutter>
        <CartPage settings={settings} page={page} />
      </Gutter>
      <Blocks blocks={page?.layout} />
    </Fragment>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchDoc<Page>({
    collection: 'pages',
    slug: 'cart',
  })

  return generateMeta({ doc: page })
}
