'use client'

import { Price } from '@/components/Price'
import { XIcon } from '@payloadcms/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@payloadcms/plugin-ecommerce/react'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Button } from '@/components/ui/button'
import { Product } from '@/payload-types'
import { Input } from '../ui/input'
import { FormError } from '../forms/FormError'

interface CouponFormData {
  couponCode: string
}

export function CartModal() {
  const { cart, applyCoupon, removeItem, removeCoupon } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const discountLines = useMemo(() => {
    const lineDiscount = cart?.items?.flatMap((item) => {
      return item.discount?.discountLines || []
    })

    return [...(lineDiscount ?? []), ...(cart?.discount?.discountLines ?? [])]
  }, [])

  const pathname = usePathname()
  const {
    formState: { errors, isLoading },
    handleSubmit,
    setError,
    reset,
    register,
  } = useForm<CouponFormData>()

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

  const onSubmit = async ({ couponCode }: { couponCode: string }) => {
    if (!cart) {
      console.error('Cart is not available')
      return
    }

    try {
      await applyCoupon(couponCode, cart.id)
      reset()
    } catch (error) {
      console.error('Error applying coupon:', error)
      console.log({ message: error.message })
      setError('couponCode', {
        message: error.message || 'An error occurred while applying the coupon',
      })
      return
    }
  }

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <OpenCartButton quantity={totalQuantity} />
      </SheetTrigger>

      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>

          <SheetDescription>Manage your cart here, add items to view the total.</SheetDescription>
        </SheetHeader>

        {!cart || cart?.items?.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-2">
            <ShoppingCart className="h-16" />
            <p className="text-center text-2xl font-bold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grow flex px-4">
            <div className="flex flex-col justify-between w-full">
              <ul className="grow overflow-auto py-4">
                {cart?.items?.map((item, i) => {
                  const product = item.product
                  const variant = item.variant

                  if (typeof product === 'string' || !item || !product || !product.slug)
                    return <React.Fragment key={i} />

                  const metaImage =
                    product.meta?.image && typeof product.meta?.image !== 'string'
                      ? product.meta.image
                      : undefined

                  const firstGalleryImage =
                    typeof product.gallery?.[0] !== 'string' ? product.gallery?.[0] : undefined

                  let image = firstGalleryImage || metaImage
                  let price = product.priceInUSD

                  const isVariant = Boolean(variant) && typeof variant === 'object'

                  if (isVariant) {
                    price = variant?.priceInUSD

                    if (variant && variant.gallery?.[0] && typeof variant.gallery[0] === 'object') {
                      image = variant.gallery[0]
                    }
                  }

                  return (
                    <li className="flex w-full flex-col" key={i}>
                      <div className="relative flex w-full flex-row justify-between px-1 py-4">
                        <div className="absolute z-40 -mt-2 ml-[55px]">
                          <DeleteItemButton item={item} />
                        </div>
                        <Link
                          className="z-30 flex flex-row space-x-4"
                          href={`/products/${(item.product as Product)?.slug}`}
                        >
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
                                    if (typeof option === 'object') return option.label
                                    return null
                                  })
                                  .join(', ')}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                        <div className="flex h-16 flex-col justify-between">
                          {typeof price === 'number' && (
                            <Price
                              amount={price}
                              className="flex justify-end space-y-2 text-right text-sm"
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

              {!!cart && (
                <div className="px-4">
                  <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4">
                    <Input
                      className="flex-grow"
                      type="text"
                      {...register('couponCode', { required: true })}
                    ></Input>
                    <Button disabled={isLoading} type="submit">
                      Apply
                    </Button>
                  </form>
                  {!!errors.couponCode && (
                    <FormError className="mt-2" message={errors.couponCode.message} />
                  )}
                </div>
              )}
              <div className="px-4">
                <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {typeof cart?.subtotal === 'number' && (
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                      <p>Subtotal</p>
                      <Price
                        amount={cart?.subtotal}
                        className="text-right text-base text-black dark:text-white"
                      />
                    </div>
                  )}

                  {!!cart?.discount?.totalAmount && (
                    <div className="mb-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p>Discount</p>
                        <Price
                          amount={cart?.discount.totalAmount}
                          className="text-right text-base text-black dark:text-white"
                        />
                      </div>

                      <div className="mb-3 flex items-center justify-between">
                        <p>Total</p>
                        <Price
                          amount={cart?.total}
                          className="text-right text-base text-black dark:text-white"
                        />
                      </div>

                      <p className="mb-2">Applied coupons</p>

                      <div className="flex flex-wrap gap-2">
                        {discountLines?.map((item) => {
                          return (
                            <div
                              key={item.id}
                              className="p-2 mb-2 flex justify-between border rounded-lg gap-2 flex-auto"
                            >
                              <p>{item.coupon.title}</p>
                              <div className="flex items-center gap-2 cursor-pointer">
                                <Price amount={item.amount} />

                                <button
                                  className="cursor-pointer"
                                  onClick={() => removeCoupon(item.coupon.identifier, cart.id)}
                                >
                                  <XIcon />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

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
