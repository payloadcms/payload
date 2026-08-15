'use client'
import React, { createContext, use, useState } from 'react'

type HoverSubmenuGroupContextValue = {
  activeId: null | string
  setActiveId: React.Dispatch<React.SetStateAction<null | string>>
}

const HoverSubmenuGroupContext = createContext<HoverSubmenuGroupContextValue | null>(null)

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
  const [activeId, setActiveId] = useState<null | string>(null)

  return (
    <HoverSubmenuGroupContext value={{ activeId, setActiveId }}>
      {children}
    </HoverSubmenuGroupContext>
  )
}

export const useHoverSubmenuGroup = () => use(HoverSubmenuGroupContext)
