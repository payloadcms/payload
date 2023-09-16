import { useWindowInfo } from '@faceless-ui/window-info'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { Props } from './types'

import useIntersect from '../../../hooks/useIntersect'
import PopupButton from './PopupButton'
import './index.scss'

const baseClass = 'popup'

const Popup: React.FC<Props> = (props) => {
  const {
    boundingRef,
    button,
    buttonClassName,
    buttonType = 'default',
    caret = true,
    children,
    className,
    color = 'light',
    forceOpen,
    horizontalAlign: horizontalAlignFromProps = 'left',
    initActive = false,
    onToggleOpen,
    padding,
    render,
    showOnHover = false,
    showScrollbar = false,
    size = 'small',
    verticalAlign: verticalAlignFromProps = 'top',
  } = props

  const { height: windowHeight, width: windowWidth } = useWindowInfo()
  const [intersectionRef, intersectionEntry] = useIntersect({
    root: boundingRef?.current || null,
    rootMargin: '-100px 0px 0px 0px',
    threshold: 1,
  })

  const buttonRef = useRef(null)
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
        let boundingRightPos = window.innerWidth
        let boundingBottomPos = window.innerHeight
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
    if (typeof onToggleOpen === 'function') onToggleOpen(active)

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
    `${baseClass}--color-${color}`,
    `${baseClass}--v-align-${verticalAlign}`,
    `${baseClass}--h-align-${horizontalAlign}`,
    active && `${baseClass}--active`,
    showScrollbar && `${baseClass}--show-scrollbar`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className={`${baseClass}__wrapper`} ref={buttonRef}>
        {showOnHover ? (
          <div
            className={`${baseClass}__on-hover-watch`}
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
          >
            <PopupButton
              {...{ active, button, buttonType, className: buttonClassName, setActive }}
            />
          </div>
        ) : (
          <PopupButton {...{ active, button, buttonType, className: buttonClassName, setActive }} />
        )}
      </div>

      <div
        className={[`${baseClass}__content`, caret && `${baseClass}__content--caret`]
          .filter(Boolean)
          .join(' ')}
        ref={contentRef}
      >
        <div className={`${baseClass}__wrap`} ref={intersectionRef}>
          <div
            className={`${baseClass}__scroll`}
            style={{
              padding,
            }}
          >
            {render && render({ close: () => setActive(false) })}
            {children && children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Popup
