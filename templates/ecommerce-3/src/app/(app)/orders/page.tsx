import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getMeUser } from '@/utilities/getMeUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

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
    <div className="container my-16">
      <div className="prose dark:prose-invert mb-12">
        <h1>Orders</h1>
        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <p className="">You have no orders.</p>
        )}
      </div>
      <RenderParams />
      {orders && orders.length > 0 && (
        <ul className="flex flex-col gap-6">
          {orders?.map((order, index) => (
            <li className="" key={order.id}>
              <div className="">
                <div className="flex gap-4 align-end mb-6" />
                <div className="mb-6">
                  <Link className="mb-4" href={`/orders/${order.id}`}>
                    <h4 className="text-xl">{`Order #${order.id}`}</h4>
                  </Link>

                  <p className="mb-4 opacity-75">
                    <time dateTime={order.createdAt}>{formatDateTime(order.createdAt)}</time>
                  </p>
                  {order.items?.length && (
                    <p className="mb-4">
                      {order.items.length} {order.items.length > 1 ? 'items' : 'item'}
                    </p>
                  )}
                  <p>
                    {'Total: '}
                    {new Intl.NumberFormat('en-US', {
                      currency: order.currency,
                      style: 'currency',
                    }).format(order.total / 100)}
                  </p>
                </div>
              </div>
              <Button variant="outline">
                <Link href={`/orders/${order.id}`}>View Order</Link>
              </Button>
              {index !== orders.length - 1 && <hr className="mt-6" />}
            </li>
          ))}
        </ul>
      )}
      <hr className="mt-6 mb-16" />
      <Button asChild variant="default">
        <Link href="/account">Go to account</Link>
      </Button>
    </div>
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
