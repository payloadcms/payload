'use client'

import type React from 'react'

import { useSyncExternalStore } from 'react'

// Whether the page is inside a frame never changes, so there's nothing to subscribe to
const subscribe = () => () => {}

/**
 * Renders its children only when the page isn't inside a frame, so other sites can't frame the page
 * and trick users into clicking them. The server can't tell, so they're missing until the browser
 * has checked, and can't be clicked inside a frame before then either.
 */
export function HiddenInFrames({ children }: { children: React.ReactNode }) {
  const isTopLevel = useSyncExternalStore(
    subscribe,
    () => window.top === window.self,
    () => false,
  )

  return isTopLevel ? children : null
}
