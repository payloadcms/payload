import clsx from 'clsx'
import React from 'react'

import { Price } from '@/components/Price'

export const Label = ({
  amount,
  position = 'bottom',
  title,
}: {
  amount: number
  position?: 'bottom' | 'center'
  title: string
}) => {
  return (
    <div
      className={clsx('absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label', {
        'lg:px-20 lg:pb-[35%]': position === 'center',
      })}
    >
      <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
        <h3 className="mr-4 line-clamp-2 grow pl-2 leading-none tracking-tight">{title}</h3>
        <Price
          amount={amount}
          className="flex-none rounded-full bg-blue-600 p-2 text-white"
          currencyCodeClassName="hidden @[275px]/label:inline"
        />
      </div>
    </div>
  )
}
