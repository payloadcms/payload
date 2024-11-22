import React, { useEffect } from 'react'

import './index.scss'

export const AnimateHeight: React.FC<{
  children: React.ReactNode
  className?: string
  contentClassName?: string
  contentStyle?: React.CSSProperties
  duration?: number
  height?: 'auto' | number
  id?: string
}> = ({ id, children, className, contentClassName, contentStyle, duration = 500, height }) => {
  const [open, setOpen] = React.useState(false)

  // allow external control of height
  useEffect(() => {
    setOpen(Boolean(height))
  }, [height])

  return (
    <div
      aria-hidden={!open}
      className={[
        className,
        'rah-static',
        open && height === 'auto' ? 'rah-static--height-auto' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      id={id}
      onClick={() => setOpen(!open)}
      onKeyDown={() => setOpen(!open)}
      role="button"
      style={{
        transition: `height ${duration}ms`,
      }}
      tabIndex={0}
    >
      <div className={contentClassName} style={contentStyle}>
        <div>{children}</div>
      </div>
    </div>
  )
}
