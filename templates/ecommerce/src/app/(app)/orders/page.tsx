import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import React from 'react'
import { AccountNav } from '@/components/AccountNav'
import { OrderItem } from '@/components/OrderItem'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export default async function Orders() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 0,
      pagination: false,
      user,
      overrideAccess: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (error) {}

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
