'use client'
import type React from 'react'

import { useMemo, useSyncExternalStore } from 'react'

type HoverSubmenuGroupContextValue = {
  activeId: null | string
  cancelPending: () => void
  register: (id: string, close: () => void) => () => void
  requestActive: (id: string, open: () => void) => void
  setActiveId: React.Dispatch<React.SetStateAction<null | string>>
}

const HOVER_OPEN_DELAY = 150
let activeId: null | string = null
const listeners = new Set<() => void>()
const closeHandlers = new Map<string, () => void>()
let pendingOpen: { id: string; timeout: ReturnType<typeof setTimeout> } | null = null

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getActiveId = () => activeId

const setActiveId: HoverSubmenuGroupContextValue['setActiveId'] = (nextActiveId) => {
  const nextId = typeof nextActiveId === 'function' ? nextActiveId(activeId) : nextActiveId
  if (nextId && activeId && activeId !== nextId) {
    closeHandlers.get(activeId)?.()
  }
  activeId = nextId
  listeners.forEach((listener) => listener())
}

const register: HoverSubmenuGroupContextValue['register'] = (id, close) => {
  closeHandlers.set(id, close)
  return () => closeHandlers.delete(id)
}

const cancelPending: HoverSubmenuGroupContextValue['cancelPending'] = () => {
  if (pendingOpen) {
    clearTimeout(pendingOpen.timeout)
    pendingOpen = null
  }
}

const requestActive: HoverSubmenuGroupContextValue['requestActive'] = (id, open) => {
  cancelPending()

  if (!activeId || activeId === id) {
    setActiveId(id)
    open()
    return
  }

  const timeout = setTimeout(() => {
    pendingOpen = null
    setActiveId(id)
    open()
  }, HOVER_OPEN_DELAY)

  pendingOpen = { id, timeout }
}

/**
 * Coordinates a set of sibling hover-opened submenus (e.g. Theme / Language / Settings)
 * so that only one can be open at a time. Without this, each submenu only knows about
 * its own trigger + content hit region, so hovering a new sibling can open its submenu
 * while a previously-hovered sibling's submenu is still considered "inside its own zone"
 * and never closes.
 */
export const useHoverSubmenuGroup = () => {
  const currentActiveId = useSyncExternalStore(subscribe, getActiveId, getActiveId)

  return useMemo(
    () => ({ activeId: currentActiveId, cancelPending, register, requestActive, setActiveId }),
    [currentActiveId],
  )
}
