'use client'
import { useEffect } from 'react'

const scrollContainerSelector = '.fixed-toolbar__scroll'

function redirectVerticalWheelToHorizontalScroll(event: WheelEvent): void {
  const isPrimarilyVerticalWheelInput = Math.abs(event.deltaY) > Math.abs(event.deltaX)
  if (!isPrimarilyVerticalWheelInput) {
    return
  }

  const target = event.target
  if (!(target instanceof Element)) {
    return
  }

  const scrollContainer = target.closest<HTMLElement>(scrollContainerSelector)
  if (!scrollContainer) {
    return
  }

  const canScrollHorizontally = scrollContainer.scrollWidth > scrollContainer.clientWidth
  if (!canScrollHorizontally) {
    return
  }

  event.preventDefault()
  scrollContainer.scrollLeft += event.deltaY
}

// A single page can render many fixed toolbars at once (e.g. rich text nested several
// layers deep inside blocks), so this listener is delegated to `document` and shared
// across every toolbar instance instead of being attached per instance. A wheel listener
// that can call preventDefault() must be non-passive, and non-passive listeners make the
// browser treat their element as a "non-fast-scrollable region" that every scroll gesture
// on the page has to be checked against, even ones nowhere near it. Attaching one instance
// per toolbar would multiply that bookkeeping by however many toolbars happen to be on the
// page; a single delegated listener keeps that cost constant no matter how many there are.
let toolbarsListeningForWheelEvents = 0

export function useRedirectVerticalWheelToHorizontalScroll(): void {
  useEffect(() => {
    if (toolbarsListeningForWheelEvents === 0) {
      document.addEventListener('wheel', redirectVerticalWheelToHorizontalScroll, {
        passive: false,
      })
    }
    toolbarsListeningForWheelEvents += 1

    return () => {
      toolbarsListeningForWheelEvents -= 1
      if (toolbarsListeningForWheelEvents === 0) {
        document.removeEventListener('wheel', redirectVerticalWheelToHorizontalScroll)
      }
    }
  }, [])
}
