'use client'

import type React from 'react'

import { createContext, use, useCallback, useEffect, useRef, useState } from 'react'

type FocusableItem = {
  id: string
  ref: React.RefObject<HTMLElement>
  type: 'load-more' | 'node'
}

type TreeFocusContextType = {
  focusedId: null | string
  moveFocus: (direction: 'down' | 'up') => void
  registerItem: (item: FocusableItem) => void
  setFocusedId: (id: null | string) => void
  unregisterItem: (id: string) => void
}

const TreeFocusContext = createContext<TreeFocusContextType | undefined>(undefined)

export const TreeFocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusedId, setFocusedId] = useState<null | string>(null)
  const itemsRef = useRef<Map<string, FocusableItem>>(new Map())

  const registerItem = useCallback((item: FocusableItem) => {
    itemsRef.current.set(item.id, item)
  }, [])

  const unregisterItem = useCallback((id: string) => {
    itemsRef.current.delete(id)
  }, [])

  const moveFocus = useCallback(
    (direction: 'down' | 'up') => {
      const items = Array.from(itemsRef.current.values())
      if (items.length === 0) {
        return
      }

      // Sort items by their DOM position to ensure correct navigation order
      const sortedItems = items
        .filter((item) => item.ref.current)
        .sort((a, b) => {
          const aElement = a.ref.current
          const bElement = b.ref.current
          if (!aElement || !bElement) {
            return 0
          }

          const position = aElement.compareDocumentPosition(bElement)
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
            return -1
          }
          if (position & Node.DOCUMENT_POSITION_PRECEDING) {
            return 1
          }
          return 0
        })

      const currentIndex = focusedId ? sortedItems.findIndex((item) => item.id === focusedId) : -1

      let nextIndex: number
      if (direction === 'down') {
        nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, sortedItems.length - 1)
      } else {
        nextIndex = Math.max(currentIndex - 1, 0)
      }

      const nextItem = sortedItems[nextIndex]
      if (nextItem && nextItem.ref.current) {
        nextItem.ref.current.focus()
        setFocusedId(nextItem.id)
      }
    },
    [focusedId],
  )

  return (
    <TreeFocusContext
      value={{
        focusedId,
        moveFocus,
        registerItem,
        setFocusedId,
        unregisterItem,
      }}
    >
      {children}
    </TreeFocusContext>
  )
}

export const useTreeFocus = () => {
  const context = use(TreeFocusContext)
  if (!context) {
    throw new Error('useTreeFocus must be used within TreeFocusProvider')
  }
  return context
}

export const useFocusableItem = ({
  id,
  type,
  ref,
}: {
  id: string
  ref: React.RefObject<HTMLElement>
  type: 'load-more' | 'node'
}) => {
  const { focusedId, registerItem, setFocusedId, unregisterItem } = useTreeFocus()
  const isFocused = focusedId === id
  const isFirstItemEver = focusedId === null

  useEffect(() => {
    registerItem({ id, type, ref })
    return () => {
      unregisterItem(id)
    }
  }, [id, ref, type, registerItem, unregisterItem])

  const handleFocus = useCallback(() => {
    setFocusedId(id)
  }, [id, setFocusedId])

  // Roving tabindex: focused item gets 0, first item (when nothing focused) gets 0, all others get -1
  const tabIndex = isFocused ? 0 : isFirstItemEver ? 0 : -1

  return {
    handleFocus,
    isFocused,
    tabIndex,
  }
}
