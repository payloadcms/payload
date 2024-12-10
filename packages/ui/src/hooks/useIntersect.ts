'use client'

import type React from 'react'

import { useEffect, useRef, useState } from 'react'

type Intersect = [
  setNode: React.Dispatch<HTMLElement>,
  entry: IntersectionObserverEntry,
  node: HTMLElement,
]

export const useIntersect = (
  { root = null, rootMargin = '0px', threshold = 0 } = {},
  disable?: boolean,
): Intersect => {
  const [entry, updateEntry] = useState<IntersectionObserverEntry>()
  const [node, setNode] = useState(null)

  const observer = useRef(
    typeof window !== 'undefined' && 'IntersectionObserver' in window && !disable
      ? new window.IntersectionObserver(([ent]) => updateEntry(ent), {
          root,
          rootMargin,
          threshold,
        })
      : null,
  )

  useEffect(() => {
    if (disable) {
      return
    }
    const { current: currentObserver } = observer
    currentObserver.disconnect()

    if (node) {
      currentObserver.observe(node)
    }

    return () => currentObserver.disconnect()
  }, [node, disable])

  return [setNode, entry, node]
}
