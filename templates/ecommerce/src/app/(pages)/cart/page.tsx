import React, { Fragment } from 'react'
import { Metadata } from 'next'

import { Page } from '../../../payload/payload-types'
import { fetchDoc } from '../../_api/fetchDoc'
import { fetchGlobals } from '../../_api/fetchGlobals'
import { Blocks } from '../../_components/Blocks'
import { Gutter } from '../../_components/Gutter'
import { Hero } from '../../_components/Hero'
import { Message } from '../../_components/Message'
import { generateMeta } from '../../_utilities/generateMeta'
import { CartPage } from './CartPage'

import classes from './index.module.scss'

export default async function Cart() {
  const { settings } = await fetchGlobals()

  const page = await fetchDoc<Page>({
    collection: 'pages',
    slug: 'cart',
  })

  return (
    <Fragment>
      {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
        <Gutter>
          <Message
            className={classes.message}
            warning={
              <Fragment>
                {'To enable checkout, you must '}
                <a
                  href="https://dashboard.stripe.com/test/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {'obtain your Stripe API Keys'}
                </a>
                {' then set them as environment variables. See the '}
                <a
                  href="https://github.com/payloadcms/payload/blob/master/templates/ecommerce/README.md#stripe"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {'README'}
                </a>
                {' for more details.'}
              </Fragment>
            }
          />
        </Gutter>
      )}
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
