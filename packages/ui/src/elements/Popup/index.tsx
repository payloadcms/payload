'use client'
import type { CSSProperties } from 'react'

export * as PopupList from './PopupButtonList/index.js'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import './index.scss'
import { PopupTrigger } from './PopupTrigger/index.js'

const baseClass = 'popup'

/**
 * Selector for all elements the browser considers tabbable.
 */
const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]',
  '[contenteditable]:not([contenteditable="false"])',
  'audio[controls]',
  'video[controls]',
  'summary',
]
  .map((s) => `${s}:not([tabindex="-1"])`)
  .join(', ')

export type PopupProps = {
  backgroundColor?: CSSProperties['backgroundColor']
  boundingRef?: React.RefObject<HTMLElement>
  button?: React.ReactNode
  /**
   * The class name to apply to the button that triggers the popup.
   */
  buttonClassName?: string
  buttonSize?: 'large' | 'medium' | 'small' | 'xsmall'
  buttonType?: 'custom' | 'default' | 'none'
  caret?: boolean
  children?: React.ReactNode
  /**
   * The class name to apply to the popup container containing the trigger.
   * This does not wrap the actual popup content, which is rendered in a portal.
   */
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
  /**
   * Class name to apply to the portal container.
   */
  portalClassName?: string
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
    portalClassName,
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

  const [mounted, setMounted] = useState(false)
  const [active, setActiveInternal] = useState(initActive)
  const [isOnTop, setIsOnTop] = useState(verticalAlign === 'top')

  // Track when component is mounted to avoid SSR/client hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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
  // Always checks viewport bounds (for flipping), but only updates
  // styles if the calculated position differs from current position.
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
    // Apply Styles (only if changed)
    // Compares calculated position with current styles to avoid unnecessary
    // DOM updates during scroll. This prevents visual lag by relying on the absolute
    // positioning where possible (popup slightly lags behind when scrolling really fast),
    // while still allowing position changes when needed (e.g., sticky parent, viewport flip).
    // Values are rounded to match browser's CSS precision and avoid false updates.
    // /////////////////////////////////////

    const newTop = `${Math.round(top)}px`
    const newLeft = `${Math.round(left + window.scrollX)}px`
    const newCaretLeft = `${Math.round(caretLeft)}px`

    if (popup.style.top !== newTop) {
      popup.style.top = newTop
    }
    if (popup.style.left !== newLeft) {
      popup.style.left = newLeft
    }
    if (popup.style.getPropertyValue('--caret-left') !== newCaretLeft) {
      popup.style.setProperty('--caret-left', newCaretLeft)
    }
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
      const focusable = Array.from(popup.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR))
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
  // Click Handler for Actionable Elements
  // Closes popup when buttons/links inside are clicked (includes Enter/Space activation).
  // /////////////////////////////////////

  const handleActionableClick = useEffectEvent((e: MouseEvent) => {
    const target = e.target as HTMLElement

    // Allow opting out with data-popup-prevent-close attribute on element or ancestor
    if (target.closest('[data-popup-prevent-close]')) {
      return
    }

    // Check if the clicked element or any ancestor is an actionable element
    const actionable = target.closest('button, a[href], [role="button"], [role="menuitem"]')
    if (actionable && popupRef.current?.contains(actionable)) {
      setActive(false)
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
        const firstFocusable = popup.querySelector<HTMLElement>(TABBABLE_SELECTOR)
        firstFocusable?.focus()
      })
    }

    // /////////////////////////////////////
    // Event Listeners
    // - resize/scroll: recalculate position (only applies styles if changed)
    // - mousedown: detect clicks outside to close
    // - keydown: handle keyboard navigation
    // /////////////////////////////////////

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true })
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    popup.addEventListener('click', handleActionableClick)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, { capture: true })
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      popup.removeEventListener('click', handleActionableClick)
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

      {mounted
        ? // We need to make sure the popup is part of the DOM (although invisible), even if it's not active.
          // This ensures that components within the popup, like modals, do not unmount when the popup closes.
          // Otherwise, modals opened from the popup will close unexpectedly when clicking within the modal, since
          // that closes the popup due to the click outside handler.
          createPortal(
            <div
              className={
                active
                  ? [
                      `${baseClass}__content`,
                      `${baseClass}--size-${size}`,
                      isOnTop ? `${baseClass}--v-top` : `${baseClass}--v-bottom`,
                      portalClassName,
                    ]
                      .filter(Boolean)
                      .join(' ')
                  : // Do not share any class names between active and disabled popups, to make sure
                    // tests do not accidentally target inactive popups.
                    `${baseClass}__hidden-content`
              }
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
          )
        : null}
    </div>
  )
}
