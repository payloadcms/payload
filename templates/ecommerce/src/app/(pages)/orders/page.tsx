import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import Stripe from 'stripe'

import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { HR } from '../../_components/HR'
import { RenderParams } from '../../_components/RenderParams'
import { getMeUser } from '../../_utilities/getMeUser'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'

import classes from './index.module.scss'

export default async function Orders() {
  const { token } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to view your orders.',
    )}&redirect=${encodeURIComponent('/orders')}`,
  })

  const orders: void | Stripe.Invoice[] = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/orders`,
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

  return (
    <Gutter className={classes.orders}>
      <h1>Orders</h1>
      {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
        <p className={classes.noOrders}>You have no orders.</p>
      )}
      <RenderParams />
      {orders && orders.length > 0 && (
        <ul className={classes.ordersList}>
          {orders?.map((order, index) => (
            <li key={order.id} className={classes.item}>
              <div className={classes.itemContent}>
                <h4 className={classes.itemTitle}>
                  <Link href={`/orders/${order.id}`}>{`Order ${order.id}`}</Link>
                </h4>
                <div className={classes.itemMeta}>
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
                      currency: order?.currency?.toUpperCase(),
                    }).format(order.amount_due / 100)}
                  </p>
                </div>
              </div>
              {index !== orders.length - 1 && <HR />}
            </li>
          ))}
        </ul>
      )}
      <HR />
      <Button href="/account" appearance="primary" label="Go to account" />
    </Gutter>
  )
}

export const metadata: Metadata = {
  title: 'Orders',
  description: 'Your orders.',
  openGraph: mergeOpenGraph({
    title: 'Orders',
    url: '/orders',
  }),
}
