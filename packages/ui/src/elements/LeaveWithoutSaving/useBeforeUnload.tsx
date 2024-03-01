// Credit: @Taiki92777
//    - Source: https://github.com/vercel/next.js/discussions/32231#discussioncomment-7284386
// Credit: `react-use` maintainers
//    -  Source: https://github.com/streamich/react-use/blob/ade8d3905f544305515d010737b4ae604cc51024/src/useBeforeUnload.ts#L2
import { useCallback, useEffect } from 'react'

function on<T extends Document | EventTarget | HTMLElement | Window>(
  obj: T | null,
  ...args: [string, Function | null, ...any] | Parameters<T['addEventListener']>
): void {
  if (obj && obj.addEventListener) {
    obj.addEventListener(...(args as Parameters<HTMLElement['addEventListener']>))
  }
}

function off<T extends Document | EventTarget | HTMLElement | Window>(
  obj: T | null,
  ...args: [string, Function | null, ...any] | Parameters<T['removeEventListener']>
): void {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(...(args as Parameters<HTMLElement['removeEventListener']>))
  }
}

export const _useBeforeUnload = (enabled: (() => boolean) | boolean = true, message?: string) => {
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

export const useBeforeUnload = (
  isConfirm = true,
  message = 'Are you sure want to leave this page?',
) => {
  // check when page is about to be reloaded
  _useBeforeUnload(isConfirm, message)

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

          const isPageLeaving = !(newUrl === currentUrl || isAnchor || isDownloadLink)

          if (isPageLeaving && isConfirm && !window.confirm(message)) {
            // Cancel the route change
            event.preventDefault()
            event.stopPropagation()
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
  }, [isConfirm, message])
}
