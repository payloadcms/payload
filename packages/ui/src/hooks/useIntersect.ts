'use client'

import type React from 'react'

import { useEffect, useState } from 'react'

type Intersect = [
  setNode: React.Dispatch<HTMLElement>,
  entry: IntersectionObserverEntry,
  node: HTMLElement,
]

export const useIntersect = (
  { root = null, rootMargin = '0px', threshold = 0 }: IntersectionObserverInit = {},
  disable?: boolean,
): Intersect => {
  const [entry, updateEntry] = useState<IntersectionObserverEntry>()
  const [node, setNode] = useState(null)

  useEffect(() => {
    if (disable || !node || !('IntersectionObserver' in window)) {
      return
    }
    let scrollRoot = node.parentElement

    while (scrollRoot && !['auto', 'scroll'].includes(getComputedStyle(scrollRoot).overflowY)) {
      scrollRoot = scrollRoot.parentElement
    }

    // Apply the preload margin to the scrolling panel rather than the window,
    // where clipping by an intermediate scroll container would discard it.
    const observer = new window.IntersectionObserver(([ent]) => updateEntry(ent), {
      root: root ?? scrollRoot,
      rootMargin,
      threshold,
    })

    observer.observe(node)

    return () => observer.disconnect()
  }, [node, disable, root, rootMargin, threshold])

  return [setNode, entry, node]
}
