import React, { useEffect } from 'react'

import type { Props } from './types'

import useIntersect from '../../../hooks/useIntersect'
import './index.scss'

const Tooltip: React.FC<Props> = (props) => {
  const { boundingRef, children, className, delay = 350, show: showFromProps = true } = props

  const [show, setShow] = React.useState(showFromProps)
  const [position, setPosition] = React.useState<'bottom' | 'top'>('top')

  const [ref, intersectionEntry] = useIntersect({
    root: boundingRef?.current || null,
    rootMargin: '-145px 0px 0px 100px',
    threshold: 0,
  })

  useEffect(() => {
    let timerId: NodeJS.Timeout

    // do not use the delay on transition-out
    if (delay && showFromProps) {
      timerId = setTimeout(() => {
        setShow(showFromProps)
      }, delay)
    } else {
      setShow(showFromProps)
    }

    return () => {
      if (timerId) clearTimeout(timerId)
    }
  }, [showFromProps, delay])

  useEffect(() => {
    setPosition(intersectionEntry?.isIntersecting ? 'top' : 'bottom')
  }, [intersectionEntry])

  return (
    <React.Fragment>
      <aside
        aria-hidden="true"
        className={['tooltip', className, 'tooltip--position-top'].filter(Boolean).join(' ')}
        ref={ref}
      >
        {children}
      </aside>

      <aside
        className={['tooltip', className, show && 'tooltip--show', `tooltip--position-${position}`]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </aside>
    </React.Fragment>
  )
}

export default Tooltip
