'use client'
import type { CSSProperties } from 'react'

export * as PopupList from './PopupButtonList/index.js'

import React, { createContext, use, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { ThemeProvider } from '../../providers/Theme/index.js'
import './index.css'
import { PopupTrigger } from './PopupTrigger/index.js'

const baseClass = 'popup'

type PopupContextValue = {
  popupRef: React.RefObject<HTMLDivElement | null>
}

const PopupContext = createContext<null | PopupContextValue>(null)

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

/**
 * Returns whether the element has a `position: fixed` ancestor (e.g. an open Drawer).
 * Such popups must be positioned with `fixed` so they don't drift when the background scrolls.
 */
const hasFixedAncestor = (element: HTMLElement | null): boolean => {
  let node = element?.parentElement
  while (node && node !== document.body) {
    if (window.getComputedStyle(node).position === 'fixed') {
      return true
    }
    node = node.parentElement
  }
  return false
}

export type PopupProps = {
  backgroundColor?: CSSProperties['backgroundColor']
  boundingRef?: React.RefObject<HTMLElement>
  button?: React.ReactNode
  /**
   * The class name to apply to the button that triggers the popup.
   */
  buttonClassName?: string
  buttonSize?: 'large' | 'medium'
  buttonType?: 'custom' | 'default'
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
  /**
   * Render prop for custom trigger button. Receives onClick/onKeyDown/aria props.
   * When provided, `button` and `buttonType` are ignored.
   */
  renderButton?: (props: {
    active: boolean
    'aria-expanded': boolean
    'aria-haspopup': true
    onClick: React.MouseEventHandler
    onKeyDown: React.KeyboardEventHandler
  }) => React.ReactNode
  showOnHover?: boolean
  /**
   * By default, the scrollbar is hidden. If you want to show it, set this to true.
   * In both cases, the container is still scrollable.
   *
   * @default false
   */
  showScrollbar?: boolean
  /**
   * Position the popup to the side of the trigger instead of above/below.
   * The popup's top edge aligns with the trigger's top edge (with viewport clamping).
   * Automatically flips to the opposite side if there is not enough space.
   * When set, `verticalAlign`, `horizontalAlign`, and the caret are ignored.
   */
  side?: 'left' | 'right'
  size?: 'fit-content' | 'large' | 'medium' | 'small'
  /**
   * Theme for the popup content. Defaults to 'dark'.
   * Set to 'auto' to inherit the current theme.
   *
   * @default 'dark'
   */
  theme?: 'auto' | 'dark' | 'light'
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
    renderButton,
    showOnHover = false,
    showScrollbar = false,
    side,
    size = 'medium',
    theme = 'dark',
    verticalAlign = 'bottom',
  } = props

  const popupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  /**
   * Whether the trigger is inside a `position: fixed` ancestor (e.g. a Drawer),
   * in which case the popup is positioned with `fixed` instead of `absolute`.
   */
  const isFixedRef = useRef(false)

  /**
   * Keeps track of whether the popup was opened via keyboard.
   * This is used to determine whether to autofocus the first element in the popup.
   * If the popup was opened via mouse, we do not want to autofocus the first element.
   */
  const openedViaKeyboardRef = useRef(false)

  const parentPopup = use(PopupContext)

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

    // Inside a fixed ancestor, use `fixed` (no scroll offset) so background scrolling
    // doesn't shift the popup. Otherwise use page coordinates (absolute).
    const useFixed = isFixedRef.current
    const scrollY = useFixed ? 0 : window.scrollY
    const scrollX = useFixed ? 0 : window.scrollX

    // Gap between the popup and the trigger/viewport edges (in pixels)
    const offset = 10
    // Additional gap used in side mode so the child popup has breathing room from its parent
    const sideOffset = 4

    let top: number
    let left: number
    let caretLeft: number

    if (side) {
      // /////////////////////////////////////
      // Side Positioning
      // Places the popup to the left or right of the parent popup (not just the trigger),
      // top-aligned with the trigger. Flips to the opposite side if there is not enough
      // viewport space.
      // /////////////////////////////////////

      // Top: align with trigger top, clamped to viewport
      top = triggerRect.top + scrollY
      const maxTop = scrollY + window.innerHeight - popupRect.height - offset
      top = Math.max(scrollY + offset, Math.min(top, maxTop))

      // Use the parent popup's bounding rect as the reference for left/right positioning
      // so the child appears 4px from the parent popup edge, not just the trigger button.
      const anchorRect = parentPopup?.popupRef.current
        ? parentPopup.popupRef.current.getBoundingClientRect()
        : triggerRect

      if (side === 'left') {
        left = anchorRect.left - popupRect.width - sideOffset
        if (left < offset) {
          // flip to right side
          left = anchorRect.right + sideOffset
        }
      } else {
        left = anchorRect.right + sideOffset
        if (left + popupRect.width + offset > window.innerWidth) {
          // flip to left side
          left = anchorRect.left - popupRect.width - sideOffset
        }
      }

      left = left + scrollX
      // Caret not used in side mode; set a neutral value
      caretLeft = popupRect.width / 2

      setIsOnTop(false)
    } else {
      // /////////////////////////////////////
      // Vertical Positioning
      // Calculates the `top` position in absolute page coordinates.
      // Uses `verticalAlign` prop as the preferred direction, but flips
      // to the opposite side if there's not enough viewport space.
      // /////////////////////////////////////

      let onTop = verticalAlign === 'top'

      if (verticalAlign === 'bottom') {
        top = triggerRect.bottom + scrollY + offset

        if (triggerRect.bottom + popupRect.height + offset > window.innerHeight) {
          // Try to flip above — only do so if there's actually enough room
          const topIfAbove = triggerRect.top + scrollY - popupRect.height - offset
          if (topIfAbove >= scrollY) {
            top = topIfAbove
            onTop = true
          }
          // else: not enough room above either — keep below and let it overflow rather than going off-screen
        }
      } else {
        top = triggerRect.top + scrollY - popupRect.height - offset

        if (triggerRect.top - popupRect.height - offset < 0) {
          top = triggerRect.bottom + scrollY + offset
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

      left =
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
      caretLeft = Math.max(12, Math.min(triggerCenter - left, popupRect.width - 12))
    }

    // /////////////////////////////////////
    // Apply Styles (only if changed)
    // Compares calculated position with current styles to avoid unnecessary
    // DOM updates during scroll. This prevents visual lag by relying on the absolute
    // positioning where possible (popup slightly lags behind when scrolling really fast),
    // while still allowing position changes when needed (e.g., sticky parent, viewport flip).
    // Values are rounded to match browser's CSS precision and avoid false updates.
    // /////////////////////////////////////

    const newTop = `${Math.round(top)}px`
    const newLeft = `${Math.round(left + scrollX)}px`
    const newCaretLeft = `${Math.round(caretLeft)}px`
    const newPosition = useFixed ? 'fixed' : ''

    if (popup.style.position !== newPosition) {
      popup.style.position = newPosition
    }
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
  // Distinguishes between parent and child popups:
  // - Click in child popup: parent stays open
  // - Click in parent popup: child closes
  // /////////////////////////////////////

  const handleClickOutside = useEffectEvent((e: MouseEvent) => {
    const target = e.target as Node
    const isOutsidePopup = !popupRef.current?.contains(target)
    const isOutsideTrigger = !triggerRef.current?.contains(target)

    // Check if click is inside a popup portal
    const clickedPopupContent = (target as Element).closest?.('.popup__content')

    // If the clicked popup contains this popup's trigger, it's a parent popup
    // and we should close. If it doesn't contain our trigger, it's a child popup
    // and we should stay open to avoid closing parent when interacting with child.
    const isInsideChildPopup =
      clickedPopupContent && !clickedPopupContent.contains(triggerRef.current)

    if (isOutsidePopup && isOutsideTrigger && !isInsideChildPopup) {
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
      // Don't close if clicking a nested popup's trigger — it will manage its own open state
      if (actionable.closest(`.${baseClass}__trigger-wrap`)) {
        return
      }
      setActive(false)
    }
  })

  // /////////////////////////////////////
  // Effect: Setup/Teardown position and focus management
  // /////////////////////////////////////

  useEffect(() => {
    if (!active) {
      const popup = popupRef.current
      if (popup) {
        // Clear inline position styles so the CSS `top: -9999px` rule on
        // `.popup__hidden-content` takes effect. Without this, the inline
        // styles set during positioning would win over the CSS rule, keeping
        // portaled children (e.g. a ReactSelect menu) visually on-screen.
        popup.style.position = ''
        popup.style.top = ''
        popup.style.left = ''
      }
      return
    }

    const popup = popupRef.current
    if (!popup) {
      return
    }

    // /////////////////////////////////////
    // Initial Position
    // Calculate and apply popup position.
    // getBoundingClientRect() forces synchronous layout.
    //
    // We call updatePosition() twice: once synchronously (so the popup
    // snaps to roughly the right place immediately rather than flashing
    // from -9999px) and once in a requestAnimationFrame, which fires
    // after the browser has finished laying out the newly-visible popup
    // content. The rAF call is the authoritative one — it catches cases
    // where the popup height wasn't stable yet during the first call
    // (e.g. ColumnSelection popup content rendering after hidden → visible
    // class switch), which was causing incorrect flip-to-top decisions.
    // /////////////////////////////////////

    // Decide the positioning strategy once per open.
    isFixedRef.current = hasFixedAncestor(triggerRef.current)

    updatePosition()
    const rafId = requestAnimationFrame(() => {
      updatePosition()
    })

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
      cancelAnimationFrame(rafId)
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
      renderButton={renderButton}
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
            <PopupContext value={{ popupRef }}>
              <div
                className={
                  active
                    ? [
                        `${baseClass}__content`,
                        `${baseClass}--size-${size}`,
                        side
                          ? `${baseClass}--side-${side}`
                          : isOnTop
                            ? `${baseClass}--v-top`
                            : `${baseClass}--v-bottom`,
                        portalClassName,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : // Do not share any class names between active and disabled popups, to make sure
                      // tests do not accidentally target inactive popups.
                      `${baseClass}__hidden-content`
                }
                data-popup-id={id || undefined}
                data-theme={theme === 'auto' ? undefined : theme}
                ref={popupRef}
              >
                <div
                  className={`${baseClass}__scroll-container${showScrollbar ? ` ${baseClass}__scroll-container--show-scrollbar` : ''}`}
                >
                  {theme === 'auto' ? (
                    <>
                      {render?.({ close: () => setActive(false) })}
                      {children}
                    </>
                  ) : (
                    <ThemeProvider theme={theme}>
                      {render?.({ close: () => setActive(false) })}
                      {children}
                    </ThemeProvider>
                  )}
                </div>
                {caret && !side && <div className={`${baseClass}__caret`} />}
              </div>
            </PopupContext>,
            document.body,
          )
        : null}
    </div>
  )
}
