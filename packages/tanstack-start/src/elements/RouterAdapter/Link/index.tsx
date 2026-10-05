import { createLink } from '@tanstack/react-router'
import React from 'react'

type LinkProps = {
  ariaCurrent?: React.AriaAttributes['aria-current']
} & React.ComponentPropsWithRef<'a'>

export const TanStackLink = createLink(function Link({
  ariaCurrent,
  children,
  ...props
}: LinkProps) {
  return (
    <a {...props} aria-current={ariaCurrent ?? props['aria-current']}>
      {children}
    </a>
  )
})
