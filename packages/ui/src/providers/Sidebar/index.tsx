'use client'
import React, { createContext, useContext, useRef } from 'react'

export type Theme = 'dark' | 'light'

export type SidebarContext = {
  ref: React.RefObject<HTMLDivElement>
}

const initialContext: SidebarContext = {
  ref: null,
}

const Context = createContext(initialContext)

export const SidebarProvider: React.FC<{
  children?: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <Context.Provider value={{ ref }}>
      <div className={className} ref={ref}>
        {children}
      </div>
    </Context.Provider>
  )
}

export const useSidebar = (): SidebarContext => useContext(Context)
