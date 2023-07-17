import React, { Fragment } from 'react'

import { Page } from '../../../payload/payload-types'
import { fetchDoc } from '../../_api/fetchDoc'
import { fetchGlobals } from '../../_api/fetchGlobals'
import { Blocks } from '../../_components/Blocks'
import { Gutter } from '../../_components/Gutter'
import { Hero } from '../../_components/Hero'
import { CartPage } from './CartPage'

const Cart = async () => {
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

export default Cart
