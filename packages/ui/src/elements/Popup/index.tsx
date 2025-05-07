'use client'
import type { CSSProperties } from 'react'

export * as PopupList from './PopupButtonList/index.js'

import { useWindowInfo } from '@faceless-ui/window-info'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useIntersect } from '../../hooks/useIntersect.js'
import { PopupTrigger } from './PopupTrigger/index.js'
import './index.scss'

const baseClass = 'popup'

export type PopupProps = {
  backgroundColor?: CSSProperties['backgroundColor']
  boundingRef?: React.RefObject<HTMLElement>
  button?: React.ReactNode
  buttonClassName?: string
  buttonSize?: 'large' | 'medium' | 'small'
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
  const [active, setActive] = useState(initActive)
  const [verticalAlign, setVerticalAlign] = useState(verticalAlignFromProps)
  const [horizontalAlign, setHorizontalAlign] = useState(horizontalAlignFromProps)

  const setPosition = useCallback(
    ({ horizontal = false, vertical = false }) => {
      if (contentRef.current) {
        const bounds = contentRef.current.getBoundingClientRect()

        const {
          bottom: contentBottomPos,
          left: contentLeftPos,
          right: contentRightPos,
          top: contentTopPos,
        } = bounds

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

        if (horizontal) {
          if (contentRightPos > boundingRightPos && contentLeftPos > boundingLeftPos) {
            setHorizontalAlign('right')
          } else if (contentLeftPos < boundingLeftPos && contentRightPos < boundingRightPos) {
            setHorizontalAlign('left')
          }
        }

        if (vertical) {
          if (contentTopPos < boundingTopPos && contentBottomPos < boundingBottomPos) {
            setVerticalAlign('bottom')
          } else if (contentBottomPos > boundingBottomPos && contentTopPos > boundingTopPos) {
            setVerticalAlign('top')
          }
        }
      }
    },
    [boundingRef],
  )

  const handleClickOutside = useCallback(
    (e) => {
      if (contentRef.current.contains(e.target)) {
        return
      }

      setActive(false)
    },
    [contentRef],
  )

  useEffect(() => {
    setPosition({ horizontal: true })
  }, [intersectionEntry, setPosition, windowWidth])

  useEffect(() => {
    setPosition({ vertical: true })
  }, [intersectionEntry, setPosition, windowHeight])

  useEffect(() => {
    if (typeof onToggleOpen === 'function') {
      onToggleOpen(active)
    }

    if (active) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [active, handleClickOutside, onToggleOpen])

  useEffect(() => {
    setActive(forceOpen)
  }, [forceOpen])

  const classes = [
    baseClass,
    className,
    `${baseClass}--size-${size}`,
    buttonSize && `${baseClass}--button-size-${buttonSize}`,
    `${baseClass}--v-align-${verticalAlign}`,
    `${baseClass}--h-align-${horizontalAlign}`,
    active && `${baseClass}--active`,
    showScrollbar && `${baseClass}--show-scrollbar`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} id={id}>
      <div className={`${baseClass}__trigger-wrap`}>
        {showOnHover ? (
          <div
            className={`${baseClass}__on-hover-watch`}
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
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

      <div className={`${baseClass}__content`} ref={contentRef}>
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
}
