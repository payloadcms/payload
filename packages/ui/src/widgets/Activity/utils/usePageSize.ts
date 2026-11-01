import type { RefObject } from 'react'

import { useLayoutEffect, useState } from 'react'

/**
 * Reads the page size the CSS container tiers set on the viewport. It is `null` until the first
 * read, while the server-rendered full batch is shown.
 */
export function usePageSize({
  paginationFocusRef,
  viewportRef,
}: {
  /** Set when the page size changes while pagination has focus, so focus can be restored. */
  paginationFocusRef: RefObject<boolean>
  viewportRef: RefObject<HTMLDivElement | null>
}) {
  const [pageSize, setPageSize] = useState<null | number>(null)

  // A layout effect, so no click is handled with the full-batch fallback size after hydration.
  useLayoutEffect(() => {
    const element = viewportRef.current

    if (!element) {
      return
    }

    let previousSize = 0
    const readPageSize = () => {
      const size = Number(getComputedStyle(element).getPropertyValue('--activity-page-size'))

      if (size > 0 && size !== previousSize) {
        previousSize = size
        if (
          element.parentElement?.contains(document.activeElement) &&
          document.activeElement?.closest('.activity-widget__pagination')
        ) {
          paginationFocusRef.current = true
        }
        setPageSize(size)
      }
    }

    readPageSize()
    const observer = new ResizeObserver(readPageSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [paginationFocusRef, viewportRef])

  return pageSize
}
