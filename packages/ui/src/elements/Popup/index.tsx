'use client'
import type { CSSProperties } from 'react'

export * as PopupList from './PopupButtonList/index.js'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  horizontalAlign?: 'center' | 'left' | 'right'
  id?: string
  initActive?: boolean
  noBackground?: boolean
  onToggleClose?: () => void
  onToggleOpen?: (active: boolean) => void
  render?: (args: { close: () => void }) => React.ReactNode
  showOnHover?: boolean
  showScrollbar?: boolean
  size?: 'fit-content' | 'large' | 'medium' | 'small'
  verticalAlign?: 'bottom' | 'top'
}

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
  const [active, setActiveInternal] = useState(initActive)
  const [isOnTop, setIsOnTop] = useState(verticalAlign === 'top')

  const setActive = useCallback(
    (isActive: boolean) => {
      if (isActive) {
        onToggleOpen?.(true)
      } else {
        onToggleClose?.()
      }
      setActiveInternal(isActive)
    },
    [onToggleClose, onToggleOpen],
  )

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const popup = popupRef.current
    if (!trigger || !popup) {
      return
    }

    const triggerRect = trigger.getBoundingClientRect()
    const popupRect = popup.getBoundingClientRect()
    const margin = 10

    // Vertical positioning with flip
    let top: number
    let onTop = verticalAlign === 'top'

    if (verticalAlign === 'bottom') {
      top = triggerRect.bottom + window.scrollY + margin
      if (triggerRect.bottom + popupRect.height + margin > window.innerHeight) {
        top = triggerRect.top + window.scrollY - popupRect.height - margin
        onTop = true
      }
    } else {
      top = triggerRect.top + window.scrollY - popupRect.height - margin
      if (triggerRect.top - popupRect.height - margin < 0) {
        top = triggerRect.bottom + window.scrollY + margin
        onTop = false
      }
    }
    setIsOnTop(onTop)

    // Horizontal positioning
    let left =
      horizontalAlign === 'right'
        ? triggerRect.right - popupRect.width
        : horizontalAlign === 'center'
          ? triggerRect.left + triggerRect.width / 2 - popupRect.width / 2
          : triggerRect.left

    left = Math.max(margin, Math.min(left, window.innerWidth - popupRect.width - margin))

    // Caret position
    const triggerCenter = triggerRect.left + triggerRect.width / 2
    const caretLeft = Math.max(12, Math.min(triggerCenter - left, popupRect.width - 12))

    popup.style.top = `${top}px`
    popup.style.left = `${left + window.scrollX}px`
    popup.style.setProperty('--caret-left', `${caretLeft}px`)
  }, [horizontalAlign, verticalAlign])

  // Position, resize, scroll, click outside, and keyboard
  useEffect(() => {
    if (!active) {
      return
    }

    const popup = popupRef.current
    if (!popup) {
      return
    }

    updatePosition()

    // Get all focusable elements
    const getFocusableElements = () =>
      popup.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )

    // Focus first element after a brief delay to ensure content is rendered
    requestAnimationFrame(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      }
    })

    const handleClickOutside = (e: MouseEvent) => {
      if (
        !popupRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setActive(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setActive(false)
        // Return focus to trigger
        triggerRef.current?.querySelector<HTMLElement>('button, [tabindex="0"]')?.focus()
        return
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusable = getFocusableElements()
        if (focusable.length === 0) {
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

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
  }, [active, updatePosition, setActive])

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
              showScrollbar && `${baseClass}--show-scrollbar`,
              isOnTop ? `${baseClass}--v-top` : `${baseClass}--v-bottom`,
            ]
              .filter(Boolean)
              .join(' ')}
            ref={popupRef}
          >
            <div className={`${baseClass}__scroll-container`}>
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
