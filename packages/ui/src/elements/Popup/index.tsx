'use client'
import type { AriaAttributes, AriaRole, CSSProperties } from 'react'

export * as PopupList from './PopupButtonList/index.js'

import React, { createContext, use, useCallback, useEffect, useId, useRef, useState } from 'react'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { ThemeProvider } from '../../providers/Theme/index.js'
import './index.css'
import { type PopupButtonRenderProps, PopupTrigger } from './PopupTrigger/index.js'

const baseClass = 'popup'

type PopupContextValue = {
  closePopupChain: () => void
  popupRef: React.RefObject<HTMLDivElement | null>
  popupRole?: AriaRole
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

const MENU_ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
const POPUP_CONTENT_SELECTOR = `.${baseClass}__content, .${baseClass}__hidden-content`

const getMenuItems = (popup: HTMLElement): HTMLElement[] =>
  Array.from(popup.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)).filter(
    (item) => item.closest(POPUP_CONTENT_SELECTOR) === popup,
  )

export type PopupProps = {
  backgroundColor?: CSSProperties['backgroundColor']
  boundingRef?: React.RefObject<HTMLElement>
  button?: React.ReactNode
  buttonAriaLabel?: string
  buttonClassName?: string
  buttonSize?: 'large' | 'medium'
  buttonType?: 'custom' | 'default'
  caret?: boolean
  children?: React.ReactNode
  className?: string
  disabled?: boolean
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
  popupAriaLabel?: string
  popupType?: AriaAttributes['aria-haspopup']
  portalClassName?: string
  render?: (args: { close: () => void }) => React.ReactNode
  /**
   * Render prop for custom trigger button. Receives onClick/onKeyDown/aria props.
   * When provided, `button` and `buttonType` are ignored.
   */
  renderButton?: (props: PopupButtonRenderProps) => React.ReactNode
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
  size?: 'fit-content' | 'large' | 'small'
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
 * The popup is rendered next to its trigger in the DOM and positioned above / below it,
 * depending on the verticalAlign prop and the space available.
 */
export const Popup: React.FC<PopupProps> = (props) => {
  const {
    id,
    button,
    buttonAriaLabel,
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
    popupAriaLabel,
    popupType,
    portalClassName,
    render,
    renderButton,
    showOnHover = false,
    showScrollbar = false,
    side,
    size = 'fit-content',
    theme = 'dark',
    verticalAlign = 'bottom',
  } = props

  const popupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const generatedContentId = useId()
  const contentId = `${id || generatedContentId}-content`

  /**
   * Keeps track of whether the popup was opened via keyboard.
   * This is used to determine whether to autofocus the first element in the popup.
   * If the popup was opened via mouse, we do not want to autofocus the first element.
   */
  const openedViaKeyboardRef = useRef(false)

  const parentPopup = use(PopupContext)
  const popupRole = (popupType === true ? 'menu' : popupType || undefined) as AriaRole | undefined

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

  const closePopup = useCallback(
    ({ restoreFocus = true }: { restoreFocus?: boolean } = {}) => {
      const trigger = triggerRef.current?.querySelector<HTMLElement>('button, [tabindex="0"]')

      setActive(false)
      if (restoreFocus) {
        requestAnimationFrame(() => trigger?.focus())
      }
    },
    [setActive],
  )
  const close = useCallback(() => closePopup(), [closePopup])
  const closePopupChain = useCallback(() => {
    closePopup({ restoreFocus: false })
    parentPopup?.closePopupChain()
  }, [closePopup, parentPopup])

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
    const offset = 8
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
      top = triggerRect.top
      const maxTop = window.innerHeight - popupRect.height - offset
      top = Math.max(offset, Math.min(top, maxTop))

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

      left = Math.max(
        offset,
        Math.min(left, Math.max(offset, window.innerWidth - popupRect.width - offset)),
      )

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
        top = triggerRect.bottom + offset

        if (triggerRect.bottom + popupRect.height + offset > window.innerHeight) {
          // Try to flip above — only do so if there's actually enough room
          const topIfAbove = triggerRect.top - popupRect.height - offset
          if (topIfAbove >= 0) {
            top = topIfAbove
            onTop = true
          }
          // else: not enough room above either — keep below and let it overflow rather than going off-screen
        }
      } else {
        top = triggerRect.top - popupRect.height - offset

        if (triggerRect.top - popupRect.height - offset < 0) {
          top = triggerRect.bottom + offset
          onTop = false
        }
      }

      const maxTop = Math.max(offset, window.innerHeight - popupRect.height - offset)
      top = Math.max(offset, Math.min(top, maxTop))

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
    const newLeft = `${Math.round(left)}px`
    const newCaretLeft = `${Math.round(caretLeft)}px`
    const newPosition = 'fixed'

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
  // - Tab/Shift+Tab: closes menus; dialogs retain normal document tab order
  // - ArrowUp/ArrowDown: moves between menu items with wrapping
  // Focus is managed manually to support elements the browser might skip.
  // /////////////////////////////////////

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    const popup = popupRef.current
    if (!popup || !active) {
      return
    }

    const activePopup = document.activeElement?.closest(`.${baseClass}__content`)
    if (activePopup && activePopup !== popup) {
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      closePopup()
      return
    }

    if (e.key === 'Tab' && popupRole === 'menu') {
      setTimeout(closePopupChain)
      return
    }

    if (['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(e.key)) {
      const menuItems = getMenuItems(popup)
      if (menuItems.length > 0) {
        e.preventDefault()

        const currentIndex = menuItems.findIndex((item) => item === document.activeElement)
        const nextIndex =
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? menuItems.length - 1
              : e.key === 'ArrowUp'
                ? currentIndex <= 0
                  ? menuItems.length - 1
                  : currentIndex - 1
                : currentIndex === -1 || currentIndex === menuItems.length - 1
                  ? 0
                  : currentIndex + 1

        menuItems.forEach((item, index) =>
          item.setAttribute('tabindex', index === nextIndex ? '0' : '-1'),
        )
        menuItems[nextIndex].focus()
        return
      }
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const focusable = Array.from(popup.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR))
      if (focusable.length === 0) {
        return
      }

      e.preventDefault()

      const currentIndex = focusable.findIndex((el) => el === document.activeElement)
      const goBackward = e.key === 'ArrowUp'

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
      if (actionable.closest(`.${baseClass}__content`) !== popupRef.current) {
        return
      }
      // Don't close if clicking a nested popup's trigger — it will manage its own open state
      if (actionable.closest(`.${baseClass}__trigger-wrap`)) {
        return
      }
      closePopup()
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

    if (!popup.matches(':popover-open')) {
      popup.showPopover()
    }

    const menuItems = getMenuItems(popup)
    menuItems.forEach((item, index) => item.setAttribute('tabindex', index === 0 ? '0' : '-1'))

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
        const firstFocusable = menuItems[0] ?? popup.querySelector<HTMLElement>(TABBABLE_SELECTOR)
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
    popup.addEventListener('keydown', handleKeyDown)
    popup.addEventListener('click', handleActionableClick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, { capture: true })
      document.removeEventListener('mousedown', handleClickOutside)
      popup.removeEventListener('keydown', handleKeyDown)
      popup.removeEventListener('click', handleActionableClick)
      if (popup.matches(':popover-open')) {
        popup.hidePopover()
      }
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
      buttonAriaLabel={buttonAriaLabel}
      buttonType={buttonType}
      className={buttonClassName}
      contentId={contentId}
      disabled={disabled}
      isMenuItem={parentPopup?.popupRole === 'menu'}
      noBackground={noBackground}
      popupType={popupType}
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

      <PopupContext value={{ closePopupChain, popupRef, popupRole }}>
        <div
          aria-label={popupAriaLabel}
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
          id={contentId}
          popover="manual"
          ref={popupRef}
          role={popupRole}
        >
          <div
            className={`${baseClass}__scroll-container${showScrollbar ? ` ${baseClass}__scroll-container--show-scrollbar` : ''}`}
          >
            {theme === 'auto' ? (
              <>
                {render?.({ close })}
                {children}
              </>
            ) : (
              <ThemeProvider theme={theme}>
                {render?.({ close })}
                {children}
              </ThemeProvider>
            )}
          </div>
          {caret && !side && <div className={`${baseClass}__caret`} />}
        </div>
      </PopupContext>
    </div>
  )
}
