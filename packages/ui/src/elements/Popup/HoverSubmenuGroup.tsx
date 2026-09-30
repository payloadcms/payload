'use client'
import type React from 'react'

import { useSyncExternalStore } from 'react'

type HoverSubmenuGroupContextValue = {
  activeId: null | string
  setActiveId: React.Dispatch<React.SetStateAction<null | string>>
}

let activeId: null | string = null
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getActiveId = () => activeId

const setActiveId: HoverSubmenuGroupContextValue['setActiveId'] = (nextActiveId) => {
  activeId = typeof nextActiveId === 'function' ? nextActiveId(activeId) : nextActiveId
  listeners.forEach((listener) => listener())
}

/**
 * Coordinates a set of sibling hover-opened submenus (e.g. Theme / Language / Settings)
 * so that only one can be open at a time. Without this, each submenu only knows about
 * its own trigger + content hit region, so hovering a new sibling can open its submenu
 * while a previously-hovered sibling's submenu is still considered "inside its own zone"
 * and never closes.
 */
export const HoverSubmenuGroupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return children
}

export const useHoverSubmenuGroup = () => {
  const currentActiveId = useSyncExternalStore(subscribe, getActiveId, getActiveId)

  return { activeId: currentActiveId, setActiveId }
}
