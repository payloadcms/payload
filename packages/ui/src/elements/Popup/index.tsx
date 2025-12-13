'use client'
import type { CSSProperties } from 'react'

export * as PopupList from './PopupButtonList/index.js'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import './index.scss'
import { PopupTrigger } from './PopupTrigger/index.js'

const baseClass = 'popup'

export type PopupProps = {
  backgroundColor?: CSSProperties['backgroundColor']
  boundingRef?: React.RefObject<HTMLElement>
  button?: React.ReactNode
  buttonClassName?: string
  buttonSize?: 'large' | 'medium' | 'small' | 'xsmall'
  buttonType?: 'custom' | 'default' | 'none'
  caret?: boolean
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  /**
   * Force control the open state of the popup, regardless of the trigger.
   */
  forceOpen?: boolean
  /**
   * Preferred horizontal alignment of the popup, if there is enough space available.
   *
   * @default 'left'
   */
  horizontalAlign?: 'center' | 'left' | 'right'
  id?: string
  initActive?: boolean
  noBackground?: boolean
  onToggleClose?: () => void
  onToggleOpen?: (active: boolean) => void
  render?: (args: { close: () => void }) => React.ReactNode
  showOnHover?: boolean
  /**
   * By default, the scrollbar is hidden. If you want to show it, set this to true.
   * In both cases, the container is still scrollable.
   *
   * @default false
   */
  showScrollbar?: boolean
  size?: 'fit-content' | 'large' | 'medium' | 'small'
  /**
   * Preferred vertical alignment of the popup (position below or above the trigger),
   * if there is enough space available.
   *
   * If the popup is too close to the edge of the viewport, it will flip to the opposite side
   * regardless of the preferred vertical alignment.
   *
   * @default 'bottom'
   */
  verticalAlign?: 'bottom' | 'top'
}

/**
 * Component that renders a popup, as well as a button that triggers the popup.
 *
 * The popup is rendered in a portal, and is automatically positioned above / below the trigger,
 * depending on the verticalAlign prop and the space available.
 */
export const Popup: React.FC<PopupProps> = (props) => {
  const {
    id,
    button,
    buttonClassName,
    buttonSize,
    buttonType = 'default',
    caret = true,
    children,
    className,
    disabled,
    forceOpen,
    horizontalAlign = 'left',
    initActive = false,
    noBackground,
    onToggleClose,
    onToggleOpen,
    render,
    showOnHover = false,
    showScrollbar = false,
    size = 'medium',
    verticalAlign = 'bottom',
  } = props

  const popupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  /**
   * Keeps track of whether the popup was opened via keyboard.
   * This is used to determine whether to autofocus the first element in the popup.
   * If the popup was opened via mouse, we do not want to autofocus the first element.
   */
  const openedViaKeyboardRef = useRef(false)
  const [active, setActiveInternal] = useState(initActive)
  const [isOnTop, setIsOnTop] = useState(verticalAlign === 'top')

  const setActive = useCallback(
    (isActive: boolean, viaKeyboard = false) => {
      if (isActive) {
        openedViaKeyboardRef.current = viaKeyboard
        onToggleOpen?.(true)
      } else {
        onToggleClose?.()
      }
      setActiveInternal(isActive)
    },
    [onToggleClose, onToggleOpen],
  )

  // /////////////////////////////////////
  // Position Calculation
  //
  // Calculates and applies popup position relative to trigger.
  // /////////////////////////////////////

  const updatePosition = useEffectEvent(() => {
    const trigger = triggerRef.current
    const popup = popupRef.current
    if (!trigger || !popup) {
      return
    }

    const triggerRect = trigger.getBoundingClientRect()
    const popupRect = popup.getBoundingClientRect()

    // Gap between the popup and the trigger/viewport edges (in pixels)
    const offset = 10

    // /////////////////////////////////////
    // Vertical Positioning
    // Calculates the `top` position in absolute page coordinates.
    // Uses `verticalAlign` prop as the preferred direction, but flips
    // to the opposite side if there's not enough viewport space.
    // /////////////////////////////////////

    let top: number
    let onTop = verticalAlign === 'top'

    if (verticalAlign === 'bottom') {
      top = triggerRect.bottom + window.scrollY + offset

      if (triggerRect.bottom + popupRect.height + offset > window.innerHeight) {
        top = triggerRect.top + window.scrollY - popupRect.height - offset
        onTop = true
      }
    } else {
      top = triggerRect.top + window.scrollY - popupRect.height - offset

      if (triggerRect.top - popupRect.height - offset < 0) {
        top = triggerRect.bottom + window.scrollY + offset
        onTop = false
      }
    }

    setIsOnTop(onTop)

    // /////////////////////////////////////
    // Horizontal Positioning
    // Calculates the `left` position based on `horizontalAlign` prop:
    // - 'left': aligns popup's left edge with trigger's left edge
    // - 'right': aligns popup's right edge with trigger's right edge
    // - 'center': centers popup horizontally relative to trigger
    // Then clamps to keep the popup within viewport bounds.
    // /////////////////////////////////////

    let left =
      horizontalAlign === 'right'
        ? triggerRect.right - popupRect.width
        : horizontalAlign === 'center'
          ? triggerRect.left + triggerRect.width / 2 - popupRect.width / 2
          : triggerRect.left

    left = Math.max(offset, Math.min(left, window.innerWidth - popupRect.width - offset))

    // /////////////////////////////////////
    // Caret Positioning
    // Positions the caret arrow to point at the trigger's horizontal center.
    // Clamps between 12px from edges to prevent caret from overflowing the popup.
    // /////////////////////////////////////

    const triggerCenter = triggerRect.left + triggerRect.width / 2
    const caretLeft = Math.max(12, Math.min(triggerCenter - left, popupRect.width - 12))

    // /////////////////////////////////////
    // Apply Styles
    // Sets absolute position using page coordinates (viewport + scroll offset).
    // Caret position is passed via CSS variable for the ::before pseudo-element.
    // /////////////////////////////////////

    popup.style.top = `${top}px`
    popup.style.left = `${left + window.scrollX}px`
    popup.style.setProperty('--caret-left', `${caretLeft}px`)
  })

  // /////////////////////////////////////
  // Click Outside Handler
  // Closes popup when clicking outside both the popup and trigger.
  // /////////////////////////////////////

  const handleClickOutside = useEffectEvent((e: MouseEvent) => {
    const isOutsidePopup = !popupRef.current?.contains(e.target as Node)
    const isOutsideTrigger = !triggerRef.current?.contains(e.target as Node)

    if (isOutsidePopup && isOutsideTrigger) {
      setActive(false)
    }
  })

  // /////////////////////////////////////
  // Keyboard Navigation
  // Handles keyboard interactions when popup is open:
  // - Escape: closes popup and returns focus to trigger
  // - Tab/Shift+Tab: cycles through focusable items with wrapping
  // - ArrowUp/ArrowDown: same as Shift+Tab/Tab for menu-style navigation
  // Focus is managed manually to support elements the browser might skip.
  // /////////////////////////////////////

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    const popup = popupRef.current
    if (!popup || !active) {
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setActive(false)
      triggerRef.current?.querySelector<HTMLElement>('button, [tabindex="0"]')?.focus()
      return
    }

    if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const focusable = Array.from(
        popup.querySelectorAll<HTMLElement>(
          '.popup-button-list__button:not(.popup-button-list__disabled)',
        ),
      )
      if (focusable.length === 0) {
        return
      }

      e.preventDefault()

      const currentIndex = focusable.findIndex((el) => el === document.activeElement)
      const goBackward = e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)

      let nextIndex: number
      if (currentIndex === -1) {
        nextIndex = goBackward ? focusable.length - 1 : 0
      } else if (goBackward) {
        nextIndex = currentIndex === 0 ? focusable.length - 1 : currentIndex - 1
      } else {
        nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1
      }

      focusable[nextIndex].focus()
    }
  })

  // /////////////////////////////////////
  // Effect: Setup/Teardown position and focus management
  // /////////////////////////////////////

  useEffect(() => {
    if (!active) {
      return
    }

    const popup = popupRef.current
    if (!popup) {
      return
    }

    // /////////////////////////////////////
    // Initial Position
    // Calculate and apply popup position immediately on open.
    // /////////////////////////////////////

    updatePosition()

    // /////////////////////////////////////
    // Focus Management
    // When opened via keyboard, autofocus the first focusable button.
    // When opened via mouse, skip autofocus to avoid unwanted highlights.
    // /////////////////////////////////////

    if (openedViaKeyboardRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready.
      requestAnimationFrame(() => {
        const firstFocusable = popup.querySelector<HTMLElement>(
          '.popup-button-list__button:not(.popup-button-list__disabled)',
        )
        firstFocusable?.focus()
      })
    }

    // /////////////////////////////////////
    // Event Listeners
    // - resize/scroll: reposition popup to stay aligned with trigger
    // - mousedown: detect clicks outside to close
    // - keydown: handle keyboard navigation
    // /////////////////////////////////////

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true })
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, { capture: true })
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])

  useEffect(() => {
    if (forceOpen !== undefined) {
      setActive(forceOpen)
    }
  }, [forceOpen, setActive])

  const Trigger = (
    <PopupTrigger
      active={active}
      button={button}
      buttonType={buttonType}
      className={buttonClassName}
      disabled={disabled}
      noBackground={noBackground}
      setActive={setActive}
      size={buttonSize}
    />
  )

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')} id={id}>
      <div className={`${baseClass}__trigger-wrap`} ref={triggerRef}>
        {showOnHover ? (
          <div
            className={`${baseClass}__on-hover-watch`}
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
            role="button"
            tabIndex={0}
          >
            {Trigger}
          </div>
        ) : (
          Trigger
        )}
      </div>

      {active &&
        createPortal(
          <div
            className={[
              `${baseClass}__content`,
              `${baseClass}--size-${size}`,
              isOnTop ? `${baseClass}--v-top` : `${baseClass}--v-bottom`,
            ]
              .filter(Boolean)
              .join(' ')}
            data-popup-id={id || undefined}
            ref={popupRef}
          >
            <div
              className={`${baseClass}__scroll-container${showScrollbar ? ` ${baseClass}__scroll-container--show-scrollbar` : ''}`}
            >
              {render?.({ close: () => setActive(false) })}
              {children}
            </div>
            {caret && <div className={`${baseClass}__caret`} />}
          </div>,
          document.body,
        )}
    </div>
  )
}
