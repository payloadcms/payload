import React, { createContext, use, useEffect, useRef } from 'react'

type Listener = {
  handler: () => void
  ref: React.RefObject<HTMLElement>
}

const ClickOutsideContext = createContext<{
  register: (listener: Listener) => void
  unregister: (listener: Listener) => void
} | null>(null)

export const ClickOutsideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listeners = useRef<Set<Listener>>(new Set())

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      listeners.current.forEach(({ handler, ref }) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          handler()
        }
      })
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const register = (listener: Listener) => listeners.current.add(listener)
  const unregister = (listener: Listener) => listeners.current.delete(listener)

  return <ClickOutsideContext value={{ register, unregister }}>{children}</ClickOutsideContext>
}

export const useClickOutsideContext = () => {
  const context = use(ClickOutsideContext)
  if (!context) {
    throw new Error('useClickOutside must be used within a ClickOutsideProvider')
  }
  return context
}
