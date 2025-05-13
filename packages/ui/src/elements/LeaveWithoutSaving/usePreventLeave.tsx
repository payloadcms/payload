'use client'
// Credit: @Taiki92777
//    - Source: https://github.com/vercel/next.js/discussions/32231#discussioncomment-7284386
// Credit: `react-use` maintainers
//    -  Source: https://github.com/streamich/react-use/blob/ade8d3905f544305515d010737b4ae604cc51024/src/useBeforeUnload.ts#L2
import { useRouter } from 'next/navigation.js'
import { useCallback, useEffect, useRef } from 'react'

import { useRouteTransition } from '../../providers/RouteTransition/index.js'

function on<T extends Document | EventTarget | HTMLElement | Window>(
  obj: null | T,
  ...args: [string, (() => void) | null, ...any] | Parameters<T['addEventListener']>
): void {
  if (obj && obj.addEventListener) {
    obj.addEventListener(...(args as Parameters<HTMLElement['addEventListener']>))
  }
}

function off<T extends Document | EventTarget | HTMLElement | Window>(
  obj: null | T,
  ...args: [string, (() => void) | null, ...any] | Parameters<T['removeEventListener']>
): void {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(...(args as Parameters<HTMLElement['removeEventListener']>))
  }
}

export const useBeforeUnload = (enabled: (() => boolean) | boolean = true, message?: string) => {
  const handler = useCallback(
    (event: BeforeUnloadEvent) => {
      const finalEnabled = typeof enabled === 'function' ? enabled() : true

      if (!finalEnabled) {
        return
      }

      event.preventDefault()

      if (message) {
        event.returnValue = message
      }

      return message
    },
    [enabled, message],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    on(window, 'beforeunload', handler)

    return () => off(window, 'beforeunload', handler)
  }, [enabled, handler])
}

export const usePreventLeave = ({
  hasAccepted = false,
  message = 'Are you sure want to leave this page?',
  onAccept,
  onPrevent,
  prevent = true,
}: {
  hasAccepted: boolean
  // if no `onPrevent` is provided, the message will be displayed in a confirm dialog
  message?: string
  onAccept?: () => void
  // to use a custom confirmation dialog, provide a function that returns a boolean
  onPrevent?: () => void
  prevent: boolean
}) => {
  // check when page is about to be reloaded
  useBeforeUnload(prevent, message)
  const { startRouteTransition } = useRouteTransition()

  const router = useRouter()
  const cancelledURL = useRef<string>('')

  // check when page is about to be changed
  useEffect(() => {
    function isAnchorOfCurrentUrl(currentUrl: string, newUrl: string) {
      const currentUrlObj = new URL(currentUrl)
      const newUrlObj = new URL(newUrl)
      // Compare hostname, pathname, and search parameters
      if (
        currentUrlObj.hostname === newUrlObj.hostname &&
        currentUrlObj.pathname === newUrlObj.pathname &&
        currentUrlObj.search === newUrlObj.search
      ) {
        // Check if the new URL is just an anchor of the current URL page
        const currentHash = currentUrlObj.hash
        const newHash = newUrlObj.hash
        return (
          currentHash !== newHash &&
          currentUrlObj.href.replace(currentHash, '') === newUrlObj.href.replace(newHash, '')
        )
      }
      return false
    }

    function findClosestAnchor(element: HTMLElement | null): HTMLAnchorElement | null {
      while (element && element.tagName.toLowerCase() !== 'a') {
        element = element.parentElement
      }
      return element as HTMLAnchorElement
    }

    function handleClick(event: MouseEvent) {
      try {
        const target = event.target as HTMLElement
        const anchor = findClosestAnchor(target)
        if (anchor) {
          const currentUrl = window.location.href
          const newUrl = anchor.href
          const isAnchor = isAnchorOfCurrentUrl(currentUrl, newUrl)
          const isDownloadLink = anchor.download !== ''
          const isNewTab = anchor.target === '_blank' || event.metaKey || event.ctrlKey

          const isPageLeaving = !(newUrl === currentUrl || isAnchor || isDownloadLink || isNewTab)

          if (isPageLeaving && prevent && (!onPrevent ? !window.confirm(message) : true)) {
            // Keep a reference of the href
            cancelledURL.current = newUrl

            // Cancel the route change
            event.preventDefault()
            event.stopPropagation()

            if (typeof onPrevent === 'function') {
              onPrevent()
            }
          }
        }
      } catch (err) {
        alert(err)
      }
    }

    // Add the global click event listener
    document.addEventListener('click', handleClick, true)

    // Clean up the global click event listener when the component is unmounted
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [onPrevent, prevent, message])

  useEffect(() => {
    if (hasAccepted && cancelledURL.current) {
      if (onAccept) {
        onAccept()
      }

      startRouteTransition(() => router.push(cancelledURL.current))
    }
  }, [hasAccepted, onAccept, router, startRouteTransition])
}
