'use client'
/* eslint-disable no-shadow */
import { useEffect, useRef, useState } from 'react'

type Intersect = [setNode: React.Dispatch<Element>, entry: IntersectionObserverEntry]

export const useIntersect = (
  { root = null, rootMargin = '0px', threshold = 0 } = {},
  disable?: boolean,
): Intersect => {
  const [entry, updateEntry] = useState<IntersectionObserverEntry>()
  const [node, setNode] = useState(null)

  const observer = useRef(
    new window.IntersectionObserver(([ent]) => updateEntry(ent), {
      root,
      rootMargin,
      threshold,
    }),
  )

  useEffect(() => {
    if (disable) {
      return
    }
    const { current: currentObserver } = observer
    currentObserver.disconnect()

    if (node) currentObserver.observe(node)

    return () => currentObserver.disconnect()
  }, [node, disable])

  return [setNode, entry]
}
