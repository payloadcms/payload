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

type Props = {
  /**
   * Disable the e.preventDefault() call on click if you want to handle it yourself via onClick
   *
   * @default true
   */
  preventDefault?: boolean
} & Parameters<typeof NextLink>[0]

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
    <NextLink
      href={href}
      onClick={(e) => {
        if (isModifiedEvent(e)) {
          return
        }

        if (onClick) {
          onClick(e)
        }

        // We need a preventDefault here so that a clicked link doesn't trigger twice,
        // once for default browser navigation and once for startRouteTransition
        if (preventDefault) {
          e.preventDefault()
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
