'use client'

import { Price } from '@/components/Price'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@/providers/Cart'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Button } from '@/components/ui/button'

export function CartModal() {
  const { cart, cartQuantity, cartTotal } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const quantityRef = useRef(
    cart?.items?.length
      ? cart.items.reduce((quantity, product) => (product.quantity || 0) + quantity, 0)
      : 0,
  )
  const pathname = usePathname()

  // useEffect(() => {
  //   // Open cart modal when quantity changes.
  //   if (cartQuantity !== quantityRef.current) {
  //     // But only if it's not already open (quantity also changes when editing items in cart).
  //     if (!isOpen && pathname !== '/checkout') {
  //       setIsOpen(true)
  //     }

  //     // Always update the quantity reference
  //     quantityRef.current = cartQuantity
  //   }
  // }, [isOpen, cartQuantity, pathname])

  useEffect(() => {
    // Close the cart modal when the pathname changes.
    setIsOpen(false)
  }, [pathname])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <OpenCartButton quantity={cartQuantity} />
      </SheetTrigger>

      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>

          <SheetDescription>Manage your cart here, add items to view the total.</SheetDescription>
        </SheetHeader>

        {!cart || cart?.items?.length === 0 ? (
          <div>
            <ShoppingCart className="h-16" />
            <p className="mt-6 text-center text-2xl font-bold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grow flex px-4">
            <div className="flex flex-col justify-between w-full">
              <ul className="grow overflow-auto py-4">
                {cart?.items?.map((item, i) => {
                  const product = item.product

                  if (typeof product === 'string' || !item || !item.url || !product)
                    return <React.Fragment key={i} />

                  const metaImage =
                    product.meta?.image && typeof product.meta?.image !== 'string'
                      ? product.meta.image
                      : undefined

                  const firstGalleryImage =
                    typeof product.gallery?.[0] !== 'string' ? product.gallery?.[0] : undefined

                  let image = firstGalleryImage || metaImage
                  let price = product.price

                  const isVariant = Boolean(item.variant)
                  const variant = product?.variants?.length
                    ? product.variants.find((v) => v.id === item.variant)
                    : undefined

                  if (isVariant) {
                    price = variant?.price
                  }

                  return (
                    <li className="flex w-full flex-col" key={i}>
                      <div className="relative flex w-full flex-row justify-between px-1 py-4">
                        <div className="absolute z-40 -mt-2 ml-[55px]">
                          <DeleteItemButton item={item} />
                        </div>
                        <Link className="z-30 flex flex-row space-x-4" href={item.url}>
                          <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-md border border-neutral-300 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                            {image?.url && (
                              <Image
                                alt={image?.alt || product?.title || ''}
                                className="h-full w-full object-cover"
                                height={94}
                                src={image.url}
                                width={94}
                              />
                            )}
                          </div>

                          <div className="flex flex-1 flex-col text-base">
                            <span className="leading-tight">{product?.title}</span>
                            {isVariant && variant ? (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                                {variant.options
                                  ?.map((option) => {
                                    return option.slug
                                  })
                                  .join(', ')}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                        <div className="flex h-16 flex-col justify-between">
                          {price && (
                            <Price
                              amount={price}
                              className="flex justify-end space-y-2 text-right text-sm"
                              currencyCode={'usd'}
                            />
                          )}
                          <div className="ml-auto flex h-9 flex-row items-center rounded-lg border">
                            <EditItemQuantityButton item={item} type="minus" />
                            <p className="w-6 text-center">
                              <span className="w-full text-sm">{item.quantity}</span>
                            </p>
                            <EditItemQuantityButton item={item} type="plus" />
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="px-4">
                <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                    <p>Total</p>
                    <Price
                      amount={cartTotal.amount}
                      className="text-right text-base text-black dark:text-white"
                      currencyCode={cartTotal.currency}
                    />
                  </div>

                  <Button asChild>
                    <Link className="w-full" href="/checkout">
                      Proceed to Checkout
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
