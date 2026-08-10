'use client'
import { autoUpdate, computePosition, flip, hide, offset, shift, size } from '@floating-ui/dom'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import './index.css'

const EDGE_GUTTER = 4

const TOP_BOTTOM_OFFSET = 10
const LEFT_RIGHT_OFFSET = 11

type Side = 'bottom' | 'left' | 'right' | 'top'

export type Props = {
  alignCaret?: 'center' | 'left' | 'right'
  children: React.ReactNode
  className?: string
  delay?: number
  /**
   * Applied to the portaled tooltip element, so it can be located independent of its
   * position in the DOM (e.g. by tests).
   */
  id?: string
  position?: Side
  show?: boolean
  /**
   * Disables adaptive placement: the tooltip always renders on `position` (or its
   * default) instead of flipping to whichever side has room. It does not affect
   * portaling - every tooltip is portaled to `document.body` regardless. @default false
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

const isTriggerHidden = (element: Element): boolean => {
  if (typeof element.checkVisibility === 'function') {
    return !element.checkVisibility()
  }

  // Fallback for browsers without `checkVisibility`: an element collapsed by a
  // `display: none` ancestor has no client rects.
  return element.getClientRects().length === 0
}

const toPlacement = (side: Side, alignCaret: 'center' | 'left' | 'right') => {
  if (side === 'left' || side === 'right' || alignCaret === 'center') {
    return side
  }

  return `${side}-${alignCaret === 'left' ? 'start' : 'end'}` as const
}

export const Tooltip: React.FC<Props> = (props) => {
  const {
    id,
    alignCaret = 'center',
    children,
    className,
    delay = 500,
    position: positionFromProps,
    show: showFromProps = true,
    staticPositioning = false,
  } = props

  const generatedID = React.useId()
  const tooltipID = id || generatedID

  const [show, setShow] = useState(showFromProps)
  const [isMounted, setIsMounted] = useState(false)
  const [placement, setPlacement] = useState<Side>(positionFromProps || 'top')

  // A hidden marker rendered where the tooltip used to live in the DOM, so its
  // parent element can be used as the floating-ui reference for the portaled tooltip.
  const triggerMarkerRef = useRef<HTMLSpanElement>(null)
  const floatingRef = useRef<HTMLDivElement | null>(null)

  const updateTokenRef = useRef(0)

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

  // Keep the tooltip mounted for the duration of its fade-out transition so the
  // portal doesn't disappear abruptly when `show` flips back to false.
  useEffect(() => {
    if (show) {
      setIsMounted(true)
      return
    }

    // Matches the `.tooltip--show` opacity transition duration.
    const timeoutID = setTimeout(() => setIsMounted(false), 200)

    return () => {
      clearTimeout(timeoutID)
    }
  }, [show])

  const updatePosition = useCallback(async () => {
    const trigger = triggerMarkerRef.current?.parentElement
    const floatingElement = floatingRef.current

    if (!trigger || !floatingElement) {
      return
    }

    const token = ++updateTokenRef.current
    const boundary = 'clippingAncestors'
    const canFlip = !staticPositioning && !positionFromProps

    const {
      middlewareData,
      placement: resolvedPlacement,
      x,
      y,
    } = await computePosition(trigger, floatingElement, {
      middleware: [
        offset(({ placement: currentPlacement }) =>
          currentPlacement.startsWith('left') || currentPlacement.startsWith('right')
            ? LEFT_RIGHT_OFFSET
            : TOP_BOTTOM_OFFSET,
        ),
        ...(canFlip ? [flip({ boundary, padding: EDGE_GUTTER })] : []),
        ...(staticPositioning
          ? []
          : [
              shift({ boundary, padding: EDGE_GUTTER }),
              size({
                apply({ availableWidth, elements }) {
                  const shouldWrap = elements.floating.scrollWidth > availableWidth

                  elements.floating.toggleAttribute('data-wrap', shouldWrap)
                  elements.floating.style.setProperty(
                    '--tooltip-max-width',
                    shouldWrap ? `${Math.floor(availableWidth)}px` : '',
                  )
                },
                boundary,
                padding: EDGE_GUTTER,
              }),
            ]),
        hide({ boundary: 'clippingAncestors' }),
      ],
      placement: toPlacement(positionFromProps || 'top', alignCaret),
      strategy: 'fixed',
    })

    // A newer call already applied a fresher position - discard this stale result.
    if (token !== updateTokenRef.current) {
      return
    }

    const hidden = isTriggerHidden(trigger) || Boolean(middlewareData.hide?.referenceHidden)

    Object.assign(floatingElement.style, {
      left: `${x}px`,
      top: `${y}px`,
      visibility: hidden ? 'hidden' : '',
    })

    const resolvedSide = resolvedPlacement.split('-')[0] as Side
    const isHorizontalSide = resolvedSide === 'left' || resolvedSide === 'right'

    const shiftX = !isHorizontalSide && alignCaret === 'center' ? middlewareData.shift?.x || 0 : 0
    const shiftY = isHorizontalSide ? middlewareData.shift?.y || 0 : 0

    floatingElement.style.setProperty('--tooltip-caret-x', shiftX ? `${-shiftX}px` : '0px')
    floatingElement.style.setProperty('--tooltip-caret-y', shiftY ? `${-shiftY}px` : '0px')

    setPlacement(resolvedSide)
  }, [alignCaret, positionFromProps, staticPositioning])

  const setFloatingElement = useCallback(
    (element: HTMLDivElement | null) => {
      floatingRef.current = element
      void updatePosition()
    },
    [updatePosition],
  )

  // While mounted, let floating-ui keep the portaled tooltip aligned to its trigger
  // as the page scrolls, the trigger resizes or moves, or a hidden ancestor becomes
  // visible again - instead of manually re-measuring on window scroll/resize alone.
  useLayoutEffect(() => {
    const trigger = triggerMarkerRef.current?.parentElement
    const floatingElement = floatingRef.current

    if (!isMounted || !trigger || !floatingElement) {
      return
    }

    const cleanupAutoUpdate = autoUpdate(trigger, floatingElement, updatePosition, {
      elementResize: 'ResizeObserver' in window,
    })

    // autoUpdate's own layout-shift tracking gives up once the trigger's rect
    // collapses to zero (e.g. behind a `display: none` ancestor), so it can't
    // tell when the trigger becomes visible again. Watch for that separately.
    const visibilityObserver =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(() => void updatePosition(), { threshold: 0 })
        : null

    visibilityObserver?.observe(trigger)

    const visualViewport = window.visualViewport

    visualViewport?.addEventListener('resize', updatePosition)
    visualViewport?.addEventListener('scroll', updatePosition)

    return () => {
      cleanupAutoUpdate()
      visibilityObserver?.disconnect()
      visualViewport?.removeEventListener('resize', updatePosition)
      visualViewport?.removeEventListener('scroll', updatePosition)
    }
  }, [isMounted, updatePosition])

  useEffect(() => {
    const trigger = triggerMarkerRef.current?.parentElement

    if (!show || !trigger) {
      return
    }

    const describedByIDs = trigger.getAttribute('aria-describedby')?.split(' ') || []

    if (!describedByIDs.includes(tooltipID)) {
      trigger.setAttribute('aria-describedby', [...describedByIDs, tooltipID].join(' '))
    }

    return () => {
      const remainingIDs = (trigger.getAttribute('aria-describedby')?.split(' ') || []).filter(
        (describedByID) => describedByID !== tooltipID,
      )

      if (remainingIDs.length) {
        trigger.setAttribute('aria-describedby', remainingIDs.join(' '))
      } else {
        trigger.removeAttribute('aria-describedby')
      }
    }
  }, [show, tooltipID])

  return (
    <React.Fragment>
      <span aria-hidden="true" ref={triggerMarkerRef} style={{ display: 'none' }} />
      {isMounted &&
        createPortal(
          <aside
            className={[
              'tooltip',
              className,
              show && 'tooltip--show',
              `tooltip--caret-${alignCaret}`,
              `tooltip--position-${placement}`,
            ]
              .filter(Boolean)
              .join(' ')}
            id={tooltipID}
            ref={setFloatingElement}
            role="tooltip"
          >
            <TooltipCaret />
            <div className="tooltip-content">{children}</div>
          </aside>,
          document.body,
        )}
    </React.Fragment>
  )
}
