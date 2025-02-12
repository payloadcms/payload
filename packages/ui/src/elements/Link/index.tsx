'use client'
import NextLinkImport from 'next/link.js'
import { useRouter } from 'next/navigation.js'
import React from 'react'

import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { formatUrl } from './formatUrl.js'

const NextLink = (NextLinkImport.default ||
  NextLinkImport) as unknown as typeof NextLinkImport.default

// Copied from  https://github.com/vercel/next.js/blob/canary/packages/next/src/client/link.tsx#L180-L191
function isModifiedEvent(event: React.MouseEvent): boolean {
  const eventTarget = event.currentTarget as HTMLAnchorElement | SVGAElement
  const target = eventTarget.getAttribute('target')
  return (
    (target && target !== '_self') ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey || // triggers resource download
    (event.nativeEvent && event.nativeEvent.which === 2)
  )
}

export const Link: React.FC<Parameters<typeof NextLink>[0]> = ({
  children,
  href,
  onClick,
  ref,
  replace,
  scroll,
  ...rest
}) => {
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  return (
    <NextLink
      href={href}
      onClick={(e) => {
        if (isModifiedEvent(e)) {
          return
        }

        if (onClick) {
          onClick(e)
        }

        startRouteTransition(() => {
          const url = typeof href === 'string' ? href : formatUrl(href)

          if (replace) {
            void router.replace(url, { scroll })
          } else {
            void router.push(url, { scroll })
          }
        })
      }}
      ref={ref}
      {...rest}
    >
      {children}
    </NextLink>
  )
}
