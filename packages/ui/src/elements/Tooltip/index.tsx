'use client'
import React, { useEffect } from 'react'

import { useIntersect } from '../../hooks/useIntersect.js'
import './index.scss'

export type Props = {
  alignCaret?: 'center' | 'left' | 'right'
  boundingRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode
  className?: string
  delay?: number
  position?: 'bottom' | 'top'
  show?: boolean
  /**
   * If the tooltip position should not change depending on if the toolbar is outside the boundingRef. @default false
   */
  staticPositioning?: boolean
}

export const Tooltip: React.FC<Props> = (props) => {
  const {
    alignCaret = 'center',
    boundingRef,
    children,
    className,
    delay = 350,
    position: positionFromProps,
    show: showFromProps = true,
    staticPositioning = false,
  } = props

  const [show, setShow] = React.useState(showFromProps)
  const [position, setPosition] = React.useState<'bottom' | 'top'>('top')

  const getTitleAttribute = (content) => (typeof content === 'string' ? content : '')

  const [ref, intersectionEntry] = useIntersect(
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
          <div className="tooltip-content">{children}</div>
        </aside>
      )}
      <aside
        className={[
          'tooltip',
          className,
          show && 'tooltip--show',
          `tooltip--caret-${alignCaret}`,
          `tooltip--position-${positionFromProps || position}`,
        ]
          .filter(Boolean)
          .join(' ')}
        title={getTitleAttribute(children)}
      >
        <div className="tooltip-content">{children}</div>
      </aside>
    </React.Fragment>
  )
}
