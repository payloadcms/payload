import clsx from 'clsx'
import React from 'react'

const dots = 'mx-[1px] inline-block h-1 w-1 animate-blink rounded-md'

export const LoadingDots = ({ className }: { className: string }) => {
  return (
    <span className="mx-2 inline-flex items-center">
      <span className={clsx(dots, className)} />
      <span className={clsx(dots, 'animation-delay-[200ms]', className)} />
      <span className={clsx(dots, 'animation-delay-[400ms]', className)} />
    </span>
  )
}
