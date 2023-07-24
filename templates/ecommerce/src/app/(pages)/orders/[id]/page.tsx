import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Stripe from 'stripe'

import { Button } from '../../../_components/Button'
import { Gutter } from '../../../_components/Gutter'
import { HR } from '../../../_components/HR'
import { Media } from '../../../_components/Media'
import { getMeUser } from '../../../_utilities/getMeUser'
import { mergeOpenGraph } from '../../../_utilities/mergeOpenGraph'

import classes from './index.module.scss'

export default async function Order({ params: { id } }) {
  const { token } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to view this order.',
    )}&redirect=${encodeURIComponent(`/order/${id}`)}`,
  })

  const order: void | Stripe.Invoice = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/order/${id}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${token}`,
      },
    },
  )?.then(res => {
    const json = res.json()
    if ('error' in json && json.error) {
      throw new Error(`Error: ${json.error}`)
    }
    return json
  })

  if (!order) {
    notFound()
  }

  return (
    <Gutter className={classes.orders}>
      <h1>Order</h1>
      <div className={classes.itemMeta}>
        <p>{`ID: ${order.id}`}</p>
        <p>
          {'Status: '}
          {order.status}
        </p>
        <p>
          {'Created: '}
          {new Date(order.created * 1000).toLocaleDateString()}
        </p>
        <p>
          {'Total: '}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: order.currency.toUpperCase(),
          }).format(order.amount_due / 100)}
        </p>
        {order?.hosted_invoice_url && (
          <p>
            <Link href={order?.hosted_invoice_url} rel="noopener noreferrer" target="_blank">
              View invoice
            </Link>
          </p>
        )}
      </div>
      <HR />
      <div className={classes.order}>
        <h4 className={classes.orderTitle}>Items</h4>
        {order.lines?.data?.map((line, index) => {
          return null
        })}
      </div>
      <HR />
      <Button href="/orders" appearance="primary" label="See all orders" />
      <br />
      <br />
      <Button href="/account" appearance="secondary" label="Go to account" />
    </Gutter>
  )
}

export async function generateMetadata({ params: { id } }): Promise<Metadata> {
  return {
    title: `Order ${id}`,
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${id}`,
      url: `/orders/${id}`,
    }),
  }
}
