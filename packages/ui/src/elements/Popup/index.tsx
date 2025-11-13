'use client'
import type { CSSProperties } from 'react'

export * as PopupList from './PopupButtonList/index.js'

import { useWindowInfo } from '@faceless-ui/window-info'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useIntersect } from '../../hooks/useIntersect.js'
import { PopupTrigger } from './PopupTrigger/index.js'
import './index.scss'

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
  forceOpen?: boolean
  horizontalAlign?: 'center' | 'left' | 'right'
  id?: string
  initActive?: boolean
  noBackground?: boolean
  onToggleClose?: () => void
  onToggleOpen?: (active: boolean) => void
  render?: (any) => React.ReactNode
  showOnHover?: boolean
  showScrollbar?: boolean
  size?: 'fit-content' | 'large' | 'medium' | 'small'
  verticalAlign?: 'bottom' | 'top'
}

export const Popup: React.FC<PopupProps> = (props) => {
  const {
    id,
    boundingRef,
    button,
    buttonClassName,
    buttonSize,
    buttonType = 'default',
    caret = true,
    children,
    className,
    disabled,
    forceOpen,
    horizontalAlign: horizontalAlignFromProps = 'left',
    initActive = false,
    noBackground,
    onToggleClose,
    onToggleOpen,
    render,
    showOnHover = false,
    showScrollbar = false,
    size = 'medium',
    verticalAlign: verticalAlignFromProps = 'top',
  } = props
  const { height: windowHeight, width: windowWidth } = useWindowInfo()

  const [intersectionRef, intersectionEntry] = useIntersect({
    root: boundingRef?.current || null,
    rootMargin: '-100px 0px 0px 0px',
    threshold: 1,
  })

  const contentRef = useRef(null)
  const triggerRef = useRef(null)
  const [active, setActive_Internal] = useState(initActive)
  const [verticalAlign, setVerticalAlign] = useState(verticalAlignFromProps)
  const [horizontalAlign, setHorizontalAlign] = useState(horizontalAlignFromProps)
  const [isMounted, setIsMounted] = useState(false)
  const [contentPosition, setContentPosition] = useState<{
    left: number
    top: number
    width: number
  }>({
    left: 0,
    top: 0,
    width: 0,
  })
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  const setActive = React.useCallback(
    (active: boolean) => {
      if (active) {
        // Store the currently focused element before opening popup
        previouslyFocusedElement.current = document.activeElement as HTMLElement
        if (typeof onToggleOpen === 'function') {
          onToggleOpen(true)
        }
      } else {
        if (typeof onToggleClose === 'function') {
          onToggleClose()
        }
        // Return focus to the previously focused element (usually the trigger button)
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus()
        }
      }
      setActive_Internal(active)
    },
    [onToggleClose, onToggleOpen],
  )

  const setPosition = useCallback(
    ({ horizontal = false, vertical = false }) => {
      if (contentRef.current && triggerRef.current) {
        const contentBounds = contentRef.current.getBoundingClientRect()
        const triggerBounds = triggerRef.current.getBoundingClientRect()

        const {
          bottom: contentBottomPos,
          height: contentHeight,
          left: contentLeftPos,
          right: contentRightPos,
          top: contentTopPos,
        } = contentBounds

        let boundingTopPos = 100
        let boundingRightPos = document.documentElement.clientWidth
        let boundingBottomPos = document.documentElement.clientHeight
        let boundingLeftPos = 0

        if (boundingRef?.current) {
          ;({
            bottom: boundingBottomPos,
            left: boundingLeftPos,
            right: boundingRightPos,
            top: boundingTopPos,
          } = boundingRef.current.getBoundingClientRect())
        }

        let newHorizontalAlign = horizontalAlign
        let newVerticalAlign = verticalAlign

        if (horizontal) {
          if (contentRightPos > boundingRightPos && contentLeftPos > boundingLeftPos) {
            newHorizontalAlign = 'right'
            setHorizontalAlign('right')
          } else if (contentLeftPos < boundingLeftPos && contentRightPos < boundingRightPos) {
            newHorizontalAlign = 'left'
            setHorizontalAlign('left')
          }
        }

        if (vertical) {
          if (contentTopPos < boundingTopPos && contentBottomPos < boundingBottomPos) {
            newVerticalAlign = 'bottom'
            setVerticalAlign('bottom')
          } else if (contentBottomPos > boundingBottomPos && contentTopPos > boundingTopPos) {
            newVerticalAlign = 'top'
            setVerticalAlign('top')
          }
        }

        // Calculate absolute position for portal
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft
        const caretSize = 10 // matches --popup-caret-size

        let topPosition = triggerBounds.top + scrollTop
        let leftPosition = triggerBounds.left + scrollLeft

        // Adjust vertical position based on alignment
        if (newVerticalAlign === 'top') {
          topPosition = triggerBounds.top + scrollTop - contentHeight - caretSize
        } else if (newVerticalAlign === 'bottom') {
          topPosition = triggerBounds.bottom + scrollTop + caretSize
        }

        // For right alignment, position from the right edge of the trigger
        if (newHorizontalAlign === 'right') {
          leftPosition = triggerBounds.right + scrollLeft
        } else if (newHorizontalAlign === 'center') {
          leftPosition = triggerBounds.left + scrollLeft + triggerBounds.width / 2
        }

        setContentPosition({
          left: leftPosition,
          top: topPosition,
          width: triggerBounds.width,
        })
      }
    },
    [boundingRef, horizontalAlign, verticalAlign],
  )

  const handleClickOutside = useCallback(
    (e) => {
      if (contentRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) {
        return
      }

      setActive(false)
    },
    [contentRef, setActive],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Close popup on Escape key
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setActive(false)
        return
      }

      // Focus trap - handle Tab key
      if (e.key === 'Tab' && contentRef.current) {
        const focusableElements = contentRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

        const focusableArray: HTMLElement[] = Array.from(focusableElements)
        const firstElement = focusableArray[0]
        const lastElement = focusableArray[focusableArray.length - 1]

        // If no focusable elements in popup, close it and let tab continue
        if (focusableArray.length === 0) {
          setActive(false)
          return
        }

        // Check if current focus is within the popup content
        const currentlyFocusedElement = document.activeElement
        const isInPopup =
          contentRef.current.contains(currentlyFocusedElement) ||
          currentlyFocusedElement === contentRef.current

        // If focus is outside popup (or on trigger), bring it to first element
        if (!isInPopup) {
          e.preventDefault()
          firstElement?.focus()
          return
        }

        // If shift+tab on first element, go to last
        if (e.shiftKey && currentlyFocusedElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
          return
        }

        // If tab on last element, go to first
        if (!e.shiftKey && currentlyFocusedElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
          return
        }
      }
    },
    [contentRef, setActive],
  )

  const handleScroll = useCallback(() => {
    setPosition({ horizontal: true, vertical: true })
  }, [setPosition])

  const handleResize = useCallback(() => {
    setPosition({ horizontal: true, vertical: true })
  }, [setPosition])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (active) {
      setPosition({ horizontal: true, vertical: true })
    }
  }, [active, setPosition])

  useEffect(() => {
    setPosition({ horizontal: true })
  }, [intersectionEntry, setPosition, windowWidth])

  useEffect(() => {
    setPosition({ vertical: true })
  }, [intersectionEntry, setPosition, windowHeight])

  useEffect(() => {
    if (active) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)

      // Focus first focusable element in popup when opened
      setTimeout(() => {
        if (contentRef.current) {
          const focusableElements = contentRef.current.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          )
          const firstElement = focusableElements[0] as HTMLElement
          firstElement?.focus()
        }
      }, 0)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [active, handleClickOutside, handleKeyDown, handleResize, handleScroll, onToggleOpen])

  useEffect(() => {
    setActive(forceOpen)
  }, [forceOpen, setActive])

  const wrapperClasses = [
    baseClass,
    className,
    buttonSize && `${baseClass}--button-size-${buttonSize}`,
  ]
    .filter(Boolean)
    .join(' ')

  const contentClasses = [
    baseClass,
    `${baseClass}--size-${size}`,
    `${baseClass}--v-align-${verticalAlign}`,
    `${baseClass}--h-align-${horizontalAlign}`,
    active && `${baseClass}--active`,
    showScrollbar && `${baseClass}--show-scrollbar`,
  ]
    .filter(Boolean)
    .join(' ')

  const popupContent = isMounted && (
    <div
      aria-hidden={!active}
      className={contentClasses}
      ref={contentRef}
      role="dialog"
      style={
        {
          '--trigger-width': `${contentPosition.width}px`,
          left: `${contentPosition.left}px`,
          position: 'fixed',
          top: `${contentPosition.top}px`,
        } as React.CSSProperties
      }
    >
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__hide-scrollbar`} ref={intersectionRef}>
          <div className={`${baseClass}__scroll-container`}>
            <div className={`${baseClass}__scroll-content`}>
              {render && render({ close: () => setActive(false) })}
              {children}
            </div>
          </div>
        </div>

        {caret && <div className={`${baseClass}__caret`} />}
      </div>
    </div>
  )

  return (
    <>
      <div className={wrapperClasses} id={id}>
        <div className={`${baseClass}__trigger-wrap`} ref={triggerRef}>
          {showOnHover ? (
            <div
              className={`${baseClass}__on-hover-watch`}
              onMouseEnter={() => setActive(true)}
              onMouseLeave={() => setActive(false)}
              role="button"
              tabIndex={0}
            >
              <PopupTrigger
                {...{
                  active,
                  button,
                  buttonType,
                  className: buttonClassName,
                  disabled,
                  noBackground,
                  setActive,
                  size: buttonSize,
                }}
              />
            </div>
          ) : (
            <PopupTrigger
              {...{
                active,
                button,
                buttonType,
                className: buttonClassName,
                disabled,
                noBackground,
                setActive,
                size: buttonSize,
              }}
            />
          )}
        </div>
      </div>

      {isMounted && createPortal(popupContent, document.body)}
    </>
  )
}
