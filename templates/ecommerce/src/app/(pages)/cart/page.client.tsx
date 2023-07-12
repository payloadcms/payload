'use client'

import React, { Fragment } from 'react'
import Link from 'next/link'

import { Page, Settings } from '../../../payload/payload-types'
import { Blocks } from '../../_components/Blocks'
import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { Hero } from '../../_components/Hero'
import { Input } from '../../_components/Input'
import { Media } from '../../_components/Media'
import { Price } from '../../_components/Price'
import { RemoveFromCartButton } from '../../_components/RemoveFromCartButton'
import { useAuth } from '../../_providers/Auth'
import { useCart } from '../../_providers/Cart'

import classes from './index.module.scss'

export const CartPageClient: React.FC<{
  settings: Settings
  page: Page
}> = props => {
  const {
    settings: { shopPage },
    page: { hero, layout },
  } = props

  const { user } = useAuth()

  const { cart, cartIsEmpty, addItemToCart, cartTotal } = useCart()

  return (
    <Fragment>
      <Hero {...hero} />
      <Gutter>
        {cartIsEmpty && (
          <div>
            Your cart is empty.
            {typeof shopPage === 'object' && shopPage?.slug && (
              <Fragment>
                {' '}
                <Link href={`/${shopPage.slug}`}>Click here</Link>
                {` to shop.`}
              </Fragment>
            )}
            {!user && (
              <Fragment>
                {' '}
                <Link href={`/login?redirect=%2Fcart`}>Log in</Link>
                {` to view a saved cart.`}
              </Fragment>
            )}
          </div>
        )}
        {cartIsEmpty === false && (
          <div className={classes.items}>
            <div className={classes.itemsTotal}>
              {`There ${cart?.items?.length === 1 ? 'is' : 'are'} ${cart?.items?.length} item${
                cart?.items?.length === 1 ? '' : 's'
              } in your cart.`}
              {!user && (
                <Fragment>
                  {' '}
                  <Link href={`/login?redirect=%2Fcart`}>Log in</Link>
                  {` to save your progress.`}
                </Fragment>
              )}
            </div>
            {cart?.items?.map((item, index) => {
              if (typeof item.product === 'object') {
                const {
                  quantity,
                  product,
                  product: { title, meta },
                } = item

                const isLast = index === (cart?.items?.length || 0) - 1

                const metaImage = meta?.image

                return (
                  <Fragment key={index}>
                    <div className={classes.row}>
                      <div className={classes.mediaWrapper}>
                        {!metaImage && <span className={classes.placeholder}>No image</span>}
                        {metaImage && typeof metaImage !== 'string' && (
                          <Media imgClassName={classes.image} resource={metaImage} fill />
                        )}
                      </div>
                      <div className={classes.rowContent}>
                        <Link href={`/products/${product.slug}`}>
                          <h6 className={classes.title}>{title}</h6>
                        </Link>
                        <label>
                          Quantity &nbsp;
                          <input
                            type="number"
                            className={classes.quantity}
                            value={quantity}
                            onChange={e => {
                              addItemToCart({
                                product,
                                quantity: Number(e.target.value),
                              })
                            }}
                          />
                        </label>
                        <Price product={product} button={false} />
                        <div>
                          <RemoveFromCartButton product={product} />
                        </div>
                      </div>
                    </div>
                    {!isLast && <hr className={classes.rowHR} />}
                  </Fragment>
                )
              }
              return null
            })}
            <div className={classes.cartTotal}>{`Cart total: ${cartTotal.formatted}`}</div>
            <Button
              className={classes.checkoutButton}
              href={user ? '/checkout' : '/login?redirect=%2Fcheckout'}
              label={user ? 'Checkout' : 'Login to checkout'}
              appearance="primary"
            />
          </div>
        )}
      </Gutter>
      <Blocks blocks={layout} />
    </Fragment>
  )
}
