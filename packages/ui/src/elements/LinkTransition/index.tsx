'use client'
import NextLinkImport from 'next/link.js'
import { useRouter } from 'next/navigation.js'
import React, { startTransition } from 'react'

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
        e.preventDefault()
        startTransition(() => {
          startRouteTransition()

          // artificially delay the transition to show the loading bar
          setTimeout(() => {
            const url = typeof href === 'string' ? href : formatUrl(href)

            if (replace) {
              void router.replace(url, { scroll })
            } else {
              void router.push(url, { scroll })
            }
          }, 3000)
        })
      }}
      ref={ref}
      {...rest}
    >
      {children}
    </NextLink>
  )
}
