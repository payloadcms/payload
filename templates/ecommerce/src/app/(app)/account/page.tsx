import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { Button } from '@/components/ui/button'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import React, { Fragment } from 'react'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { AccountForm } from './AccountForm'
import { AccountNav } from '@/components/AccountNav'
import { Order } from '@/payload-types'
import { OrderItem } from '@/components/OrderItem'
import { getPayload } from 'payload'

export default async function Account() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 5,
      user,
      overrideAccess: false,
      pagination: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (error) {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

  return (
    <div>
      <div className="container">
        <RenderParams className="" />
      </div>

      <div className="container mt-16 pb-8 flex gap-8">
        <AccountNav className="max-w-[17.5rem] grow flex flex-col items-start gap-4" />

        <div className="flex flex-col gap-12">
          <div className="border p-8 rounded-lg bg-primary-foreground">
            <h1 className="text-3xl font-medium mb-8">Account settings</h1>
            <AccountForm />
          </div>

          <div className=" border p-8 rounded-lg bg-primary-foreground">
            <h2 className="text-3xl font-medium mb-8">Recent Orders</h2>

            <div className="prose dark:prose-invert mb-8">
              <p>
                These are the most recent orders you have placed. Each order is associated with an
                payment. As you place more orders, they will appear in your orders list.
              </p>
            </div>

            {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
              <p className="mb-8">You have no orders.</p>
            )}

            {orders && orders.length > 0 && (
              <ul className="flex flex-col gap-6 mb-8">
                {orders?.map((order, index) => (
                  <li key={order.id}>
                    <OrderItem order={order} />
                  </li>
                ))}
              </ul>
            )}

            <Button asChild variant="default">
              <Link href="/orders">View all orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
