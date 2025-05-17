import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'

import { getMeUser } from '@/utilities/getMeUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { notFound } from 'next/navigation'
import React from 'react'
import { AccountNav } from '@/components/AccountNav'
import { OrderItem } from '@/components/OrderItem'

export default async function Orders() {
  const { token } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to view your orders.',
    )}&redirect=${encodeURIComponent('/orders')}`,
  })

  let orders: Order[] | null = null

  try {
    orders = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?depth=0&sort=-createdAt`,
      {
        cache: 'no-store',
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )
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
      <RenderParams />

      <div className="container mt-16 pb-8 flex gap-8">
        <AccountNav className="max-w-[17.5rem] grow flex flex-col items-start gap-4" />

        <div className="flex flex-col gap-12 grow">
          <div className="border p-8 rounded-lg bg-primary-foreground w-full">
            <h1 className="text-3xl font-medium mb-8">Orders</h1>
            {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
              <p className="">You have no orders.</p>
            )}

            {orders && orders.length > 0 && (
              <ul className="flex flex-col gap-6">
                {orders?.map((order, index) => (
                  <li key={order.id}>
                    <OrderItem order={order} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
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
