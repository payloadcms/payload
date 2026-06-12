'use client'
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'

import { useIntersect } from '../../hooks/useIntersect.js'
import './index.css'

const EDGE_GUTTER = 8

const getClipBoundary = (el: HTMLElement | null): DOMRect | null => {
  let current = el?.parentElement || null

  while (current) {
    const { overflowX } = window.getComputedStyle(current)
    if (
      overflowX === 'auto' ||
      overflowX === 'clip' ||
      overflowX === 'hidden' ||
      overflowX === 'scroll'
    ) {
      return current.getBoundingClientRect()
    }
    current = current.parentElement
  }

  return null
}

export type Props = {
  alignCaret?: 'center' | 'left' | 'right'
  boundingRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode
  className?: string
  delay?: number
  position?: 'bottom' | 'left' | 'right' | 'top'
  show?: boolean
  /**
   * If the tooltip position should not change depending on if the toolbar is outside the boundingRef. @default false
   */
  staticPositioning?: boolean
}

const TooltipCaret: React.FC = () => {
  const clipId = React.useId()

  return (
    <svg aria-hidden="true" className="tooltip__caret" height="14" viewBox="0 0 14 14" width="15">
      <clipPath id={clipId}>
        <rect height="14" width="15" x="-0.5" y="0.5" />
      </clipPath>
      {/* Border stroke - clipped to hide top edge */}
      <path
        className="tooltip__caret-stroke"
        clipPath={`url(#${clipId})`}
        d="M0,0 H14 L7.875,6.125 Q7,7 6.125,6.125 Z"
      />
      {/* Fill path */}
      <path className="tooltip__caret-fill" d="M0,0 H14 L7.875,6.125 Q7,7 6.125,6.125 Z" />
    </svg>
  )
}

export const Tooltip: React.FC<Props> = (props) => {
  const {
    alignCaret = 'center',
    boundingRef,
    children,
    className,
    delay = 500,
    position: positionFromProps,
    show: showFromProps = true,
    staticPositioning = false,
  } = props

  const [show, setShow] = React.useState(showFromProps)
  const [position, setPosition] = React.useState<'bottom' | 'left' | 'right' | 'top'>('top')
  const [shiftX, setShiftX] = useState(0)
  const [maxWidth, setMaxWidth] = useState<null | number>(null)

  const [ref, intersectionEntry, node] = useIntersect(
    {
      root: boundingRef?.current || null,
      rootMargin: '-145px 0px 0px 100px',
      threshold: 0,
    },
    staticPositioning,
  )

  useEffect(() => {
    let timerID: NodeJS.Timeout

    // do not use the delay on transition-out
    if (delay && showFromProps) {
      timerID = setTimeout(() => {
        setShow(showFromProps)
      }, delay)
    } else {
      setShow(showFromProps)
    }

    return () => {
      if (timerID) {
        clearTimeout(timerID)
      }
    }
  }, [showFromProps, delay])

  useEffect(() => {
    if (staticPositioning) {
      return
    }
    setPosition(intersectionEntry?.isIntersecting ? 'top' : 'bottom')
  }, [intersectionEntry, staticPositioning])

  // Keep a horizontally-centered tooltip (top/bottom) inside its boundary by
  // shifting it inward by exactly the amount it would overflow. The hidden
  // measuring aside (`node`) provides the natural, unshifted geometry.
  const computeShift = useCallback(() => {
    const usesHorizontalCenter =
      (positionFromProps || position) === 'top' || (positionFromProps || position) === 'bottom'

    if (staticPositioning || !node || !usesHorizontalCenter) {
      setShiftX(0)
      setMaxWidth(null)
      return
    }

    const rect = node.getBoundingClientRect()
    const boundary =
      boundingRef?.current?.getBoundingClientRect() ?? getClipBoundary(node) ?? undefined
    const leftEdge = (boundary?.left ?? 0) + EDGE_GUTTER
    const rightEdge = (boundary?.right ?? window.innerWidth) - EDGE_GUTTER
    const available = rightEdge - leftEdge

    // When the tooltip can't fit even at full boundary width, cap it so it wraps.
    const nextMaxWidth = rect.width > available ? available : null
    setMaxWidth(nextMaxWidth)

    // Compute the shift against the clamped box, kept centered on the anchor.
    const center = rect.left + rect.width / 2
    const effectiveWidth = nextMaxWidth ?? rect.width
    const effectiveLeft = center - effectiveWidth / 2
    const effectiveRight = center + effectiveWidth / 2

    let shift = 0
    if (effectiveRight > rightEdge) {
      shift = rightEdge - effectiveRight
    }
    if (effectiveLeft + shift < leftEdge) {
      shift = leftEdge - effectiveLeft
    }

    setShiftX(shift)
  }, [boundingRef, node, position, positionFromProps, staticPositioning])

  useLayoutEffect(() => {
    if (!show) {
      return
    }

    computeShift()
    window.addEventListener('resize', computeShift)

    return () => {
      window.removeEventListener('resize', computeShift)
    }
  }, [show, computeShift])

  // The first aside is always on top. The purpose of that is that it can reliably be used for the interaction observer (as it's not moving around), to calculate the position of the actual tooltip.
  return (
    <React.Fragment>
      {!staticPositioning && (
        <aside
          aria-hidden="true"
          className={['tooltip', className, `tooltip--caret-${alignCaret}`, 'tooltip--position-top']
            .filter(Boolean)
            .join(' ')}
          ref={ref}
          style={{ opacity: '0' }}
        >
          <TooltipCaret />
          <div className="tooltip-content">{children}</div>
        </aside>
      )}
      <aside
        className={[
          'tooltip',
          className,
          show && 'tooltip--show',
          maxWidth && 'tooltip--wrap',
          `tooltip--caret-${alignCaret}`,
          `tooltip--position-${positionFromProps || position}`,
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          {
            ...(maxWidth ? { '--tooltip-max-width': `${maxWidth}px` } : {}),
            ...(shiftX
              ? {
                  '--tooltip-caret-x': `${-shiftX}px`,
                  '--tooltip-x': `calc(-50% + ${shiftX}px)`,
                }
              : {}),
          } as React.CSSProperties
        }
      >
        <TooltipCaret />
        <div className="tooltip-content">{children}</div>
      </aside>
    </React.Fragment>
  )
}
