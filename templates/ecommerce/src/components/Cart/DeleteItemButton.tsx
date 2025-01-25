'use client'

import type { CartItem } from '@/providers/Cart/reducer'

import { useCart } from '@/providers/Cart'
import clsx from 'clsx'
import { XIcon } from 'lucide-react'
import React from 'react'

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { deleteItemFromCart } = useCart()
  const itemId = item.id

  return (
    <form>
      <button
        aria-disabled={!itemId}
        aria-label="Remove cart item"
        className={clsx(
          'ease flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-500 transition-all duration-200',
          {
            'cursor-not-allowed px-0': !itemId,
          },
        )}
        disabled={!itemId}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (itemId) deleteItemFromCart(itemId)
        }}
        type="button"
      >
        <XIcon className="hover:text-accent-3 mx-[1px] h-4 w-4 text-white dark:text-black" />
      </button>
    </form>
  )
}
