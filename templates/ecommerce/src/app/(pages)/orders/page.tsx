import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import type { Order } from '../../../payload/payload-types'

import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { HR } from '../../_components/HR'
import { RenderParams } from '../../_components/RenderParams'
import { formatDateTime } from '../../_utilities/formatDateTime'
import { getMeUser } from '../../_utilities/getMeUser'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'
import classes from './index.module.scss'

export default async function Orders() {
  const { token } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to view your orders.',
    )}&redirect=${encodeURIComponent('/orders')}`,
  })

  let orders: Order[] | null = null

  try {
    orders = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders`, {
      cache: 'no-store',
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
    })
      ?.then(async (res) => {
        if (!res.ok) notFound()
        const json = await res.json()
        if ('error' in json && json.error) notFound()
        if ('errors' in json && json.errors) notFound()
        return json
      })
      ?.then((json) => json.docs)
  } catch (error) {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

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
            <li className={classes.listItem} key={order.id}>
              <Link className={classes.item} href={`/orders/${order.id}`}>
                <div className={classes.itemContent}>
                  <h4 className={classes.itemTitle}>{`Order ${order.id}`}</h4>
                  <div className={classes.itemMeta}>
                    <p>{`Ordered On: ${formatDateTime(order.createdAt)}`}</p>
                    <p>
                      {'Total: '}
                      {new Intl.NumberFormat('en-US', {
                        currency: 'usd',
                        style: 'currency',
                      }).format(order.total / 100)}
                    </p>
                  </div>
                </div>
                <Button
                  appearance="secondary"
                  className={classes.button}
                  el="button"
                  label="View Order"
                />
              </Link>
              {index !== orders.length - 1 && <HR />}
            </li>
          ))}
        </ul>
      )}
      <HR />
      <Button appearance="primary" href="/account" label="Go to account" />
    </Gutter>
  )
}

export const metadata: Metadata = {
  description: 'Your orders.',
  openGraph: mergeOpenGraph({
    title: 'Orders',
    url: '/orders',
  }),
  title: 'Orders',
}
