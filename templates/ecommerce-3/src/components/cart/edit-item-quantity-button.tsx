'use client'

import type { CartItem } from '@/providers/Cart/reducer'

import { useCart } from '@/providers/Cart'
import clsx from 'clsx'
import { MinusIcon, PlusIcon } from 'lucide-react'
import React from 'react'

export function EditItemQuantityButton({ type, item }: { item: CartItem; type: 'minus' | 'plus' }) {
  const { decrementQuantity, incrementQuantity } = useCart()

  return (
    <form>
      <button
        aria-disabled={!item.id}
        aria-label={type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'}
        className={clsx(
          'ease flex h-full min-w-[36px] max-w-[36px] flex-none items-center justify-center rounded-full px-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80',
          {
            'cursor-not-allowed': !item.id,
            'ml-auto': type === 'minus',
          },
        )}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()

          if (item.id) {
            if (type === 'plus') {
              incrementQuantity(item.id)
            } else {
              decrementQuantity(item.id)
            }
          }
        }}
        type="button"
      >
        {type === 'plus' ? (
          <PlusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
        ) : (
          <MinusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
        )}
      </button>
    </form>
  )
}
