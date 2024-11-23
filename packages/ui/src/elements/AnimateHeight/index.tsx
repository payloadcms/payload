import React, { useEffect, useRef } from 'react'

import './index.scss'
import { usePatchAnimateHeight } from './usePatchAnimateHeight.js'

export const AnimateHeight: React.FC<{
  children: React.ReactNode
  className?: string
  duration?: number
  height?: 'auto' | number
  id?: string
}> = ({ id, children, className, duration = 300, height }) => {
  const [open, setOpen] = React.useState(false)

  useEffect(() => {
    setOpen(Boolean(height))
  }, [height])

  const containerRef = useRef<HTMLDivElement>(null)

  const { browserSupportsKeywordAnimation } = usePatchAnimateHeight({
    containerRef,
    duration,
    open,
  })

  return (
    <div
      aria-hidden={!open}
      className={[className, 'rah-static', open && height === 'auto' && 'rah-static--height-auto']
        .filter(Boolean)
        .join(' ')}
      id={id}
      ref={containerRef}
      style={{
        transition: [
          `height ${duration}ms ease`,
          browserSupportsKeywordAnimation && `max-height ${duration}ms ease`,
        ]
          .filter(Boolean)
          .join(','),
      }}
    >
      <div>{children}</div>
    </div>
  )
}
