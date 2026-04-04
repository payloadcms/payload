'use client'
import type { LinkAdapterProps } from 'payload'

import React from 'react'

import { PayloadLink, useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'

function isModifiedEvent(event: React.MouseEvent): boolean {
  const eventTarget = event.currentTarget as HTMLAnchorElement | SVGAElement
  const target = eventTarget.getAttribute('target')
  return (
    (target && target !== '_self') ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.nativeEvent && event.nativeEvent.which === 2)
  )
}

type Props = {
  /**
   * Disable the e.preventDefault() call on click if you want to handle it yourself via onClick
   *
   * @default true
   */
  preventDefault?: boolean
} & { ref?: React.Ref<HTMLAnchorElement> } & LinkAdapterProps

export const Link: React.FC<Props> = ({
  children,
  href,
  onClick,
  preventDefault = true,
  ref,
  replace,
  scroll,
  ...rest
}) => {
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  return (
    <PayloadLink
      href={href}
      onClick={(e) => {
        if (isModifiedEvent(e)) {
          return
        }

        if (onClick) {
          onClick(e)
        }

        if (preventDefault) {
          e.preventDefault()
        }

        const url = href

        const navigate = () => {
          if (replace) {
            void router.replace(url, { scroll })
          } else {
            void router.push(url, { scroll })
          }
        }

        startRouteTransition(navigate)
      }}
      ref={ref}
      {...rest}
    >
      {children}
    </PayloadLink>
  )
}
