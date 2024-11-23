import React, { useEffect, useRef } from 'react'

import { usePatchAnimateHeight } from './usePatchAnimateHeight.js'
import './index.scss'

export const AnimateHeight: React.FC<{
  children: React.ReactNode
  className?: string
  duration?: number
  height?: 'auto' | number
  id?: string
}> = ({ id, children, className, duration = 300, height }) => {
  const [open, setOpen] = React.useState(false)
  const displaytimer = useRef<null | number>(null)
  const [display, setDisplay] = React.useState<CSSStyleDeclaration['display']>('none')

  useEffect(() => {
    setOpen(Boolean(height))
  }, [height])

  useEffect(() => {
    if (open) {
      setDisplay('')
      clearTimeout(displaytimer.current)
    } else {
      displaytimer.current = window.setTimeout(() => {
        setDisplay('none')
      }, duration)
    }
  }, [open, duration])

  const containerRef = useRef<HTMLDivElement>(null)

  usePatchAnimateHeight({
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
        transition: `height ${duration}ms ease`,
      }}
    >
      <div
        style={{
          ...(display
            ? {
                display,
              }
            : {}),
        }}
      >
        {children}
      </div>
    </div>
  )
}
