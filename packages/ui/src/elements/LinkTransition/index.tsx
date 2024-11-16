'use client'
import LinkImport from 'next/link.js'
import { useRouter } from 'next/navigation.js'
import React, { startTransition } from 'react'

import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { formatUrl } from './formatUrl.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

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

export const LinkTransition: React.FC<Parameters<typeof Link>[0]> = ({
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
    <Link
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
    </Link>
  )
}
