import type { RefObject } from 'react'

import { useLayoutEffect, useState } from 'react'

export function usePageSize({
  paginationFocusRef,
  viewportRef,
}: {
  paginationFocusRef: RefObject<boolean>
  viewportRef: RefObject<HTMLDivElement | null>
}) {
  const [pageSize, setPageSize] = useState<null | number>(null)

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
