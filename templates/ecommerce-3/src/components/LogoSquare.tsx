import clsx from 'clsx'
import React from 'react'

import { LogoIcon } from './icons/logo'

export function LogoSquare({ size }: { size?: 'sm' | undefined }) {
  return (
    <div
      className={clsx(
        'flex flex-none items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black',
        {
          'h-[30px] w-[30px] rounded-lg': size === 'sm',
          'h-[40px] w-[40px] rounded-xl': !size,
        },
      )}
    >
      <LogoIcon
        className={clsx({
          'h-[10px] w-[10px]': size === 'sm',
          'h-[16px] w-[16px]': !size,
        })}
      />
    </div>
  )
}
