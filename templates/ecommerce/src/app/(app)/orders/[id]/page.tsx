import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { ItemsList } from '@/components/ItemsList'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getMeUser } from '@/utilities/getMeUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { Fragment } from 'react'
import { ChevronLeftIcon } from 'lucide-react'
import { formatNumberToCurrency } from '@/utilities/formatNumberToCurrency'
import { ProductItem } from '@/components/ProductItem'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ paymentId?: string }>
}

export default async function Order({ params, searchParams }: PageProps) {
  const { token } = await getMeUser()

  const { id } = await params
  const { paymentId = '' } = await searchParams

  let order: Order | null = null

  try {
    order = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${id}?where=[stripePaymentIntentID][equals]=${paymentId}&depth=2`,
      {
        headers: {
          ...(token
            ? {
                Authorization: `JWT ${token}`,
              }
            : {}),
          'Content-Type': 'application/json',
        },
      },
    )?.then(async (res) => {
      if (!res.ok) notFound()
      const json = await res.json()
      if ('error' in json && json.error) notFound()
      if ('errors' in json && json.errors) notFound()
      return json
    })
  } catch (error) {
    console.error(error)
  }

  if (!order) {
    notFound()
  }

  console.log({ order })

  return (
    <div className="container my-12">
      <div className="flex gap-8 justify-between items-center mb-6">
        {token ? (
          <div className="flex gap-4">
            <Button asChild variant="ghost">
              <Link href="/orders">
                <ChevronLeftIcon />
                All orders
              </Link>
            </Button>
          </div>
        ) : (
          <div></div>
        )}

        <h1 className="text-sm uppercase font-mono px-2 bg-primary/10 rounded tracking-[0.07em]">
          <span className="">{`Order #${order.id}`}</span>
        </h1>
      </div>

      <div className="bg-card border rounded-lg px-6 py-4 flex flex-col gap-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div className="">
            <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Order Date</p>
            <p className="text-lg">
              <time dateTime={order.createdAt}>
                {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
              </time>
            </p>
          </div>

          <div className="">
            <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Total</p>
            <p className="text-lg">{formatNumberToCurrency(order.total)}</p>
          </div>

          <div className="grow max-w-1/3">
            <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Status</p>
            <p className="text-lg capitalize">{order.status}</p>
          </div>
        </div>

        {order.items && (
          <div>
            <h2 className="font-mono text-primary/50 mb-4 uppercase text-sm">Items</h2>
            <div className="">
              {order.items?.map((item) => {
                if (typeof item.product === 'string') {
                  return null
                }

                return (
                  <ProductItem
                    key={item.id}
                    product={item.product}
                    quantity={item.quantity ?? undefined}
                    selectedVariant={item.variant ?? undefined}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${id}`,
      url: `/orders/${id}`,
    }),
    title: `Order ${id}`,
  }
}
