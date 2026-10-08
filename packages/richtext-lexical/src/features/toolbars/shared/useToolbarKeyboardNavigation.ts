'use client'

import type { RefObject } from 'react'

import { useEffect } from 'react'

export function useToolbarKeyboardNavigation({
  toolbarRef,
}: {
  toolbarRef: RefObject<HTMLDivElement | null>
}) {
  useEffect(() => {
    const toolbar = toolbarRef.current

    if (!toolbar) {
      return
    }

    let activeButton: HTMLButtonElement | undefined
    const getButtons = () =>
      Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button')).filter(
        (button) =>
          !button.closest('[role="menu"]') && button.closest('[role="toolbar"]') === toolbar,
      )

    const updateTabStops = () => {
      const buttons = getButtons()
      const enabledButtons = buttons.filter((button) => !button.disabled)

      if (!activeButton || !enabledButtons.includes(activeButton)) {
        activeButton = enabledButtons[0]
      }

      for (const button of buttons) {
        button.tabIndex = button === activeButton ? 0 : -1
      }
    }

    const handleFocus = (event: FocusEvent) => {
      const button = getButtons().find((button) => button === event.target)

      if (button) {
        activeButton = button
        updateTabStops()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }

      const buttons = getButtons().filter((button) => !button.disabled)
      const index = buttons.findIndex((button) => button === event.target)

      // Dropdown menus and custom inputs retain their own keyboard behavior.
      if (index === -1) {
        return
      }

      const isRTL = getComputedStyle(toolbar).direction === 'rtl'
      let nextIndex: number

      switch (event.key) {
        case 'ArrowLeft':
          nextIndex = index + (isRTL ? 1 : -1)
          break
        case 'ArrowRight':
          nextIndex = index + (isRTL ? -1 : 1)
          break
        case 'End':
          nextIndex = buttons.length - 1
          break
        case 'Home':
          nextIndex = 0
          break
        default:
          return
      }

      event.preventDefault()
      event.stopPropagation()
      buttons[(nextIndex + buttons.length) % buttons.length]?.focus()
    }

    updateTabStops()
    const observer = new MutationObserver(updateTabStops)

    observer.observe(toolbar, { attributeFilter: ['disabled'], childList: true, subtree: true })
    toolbar.addEventListener('focusin', handleFocus)
    toolbar.addEventListener('keydown', handleKeyDown)

    return () => {
      observer.disconnect()
      toolbar.removeEventListener('focusin', handleFocus)
      toolbar.removeEventListener('keydown', handleKeyDown)
    }
  }, [toolbarRef])
}
