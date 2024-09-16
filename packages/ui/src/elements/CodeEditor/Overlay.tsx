import React, { useEffect, useRef } from 'react'

import type { OverlayProps } from './types.js'

import './Overlay.scss'

const Overlay: React.FC<OverlayProps> = ({ onMouseEnter, onMouseLeave, showOverlay }) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlayEl = overlayRef.current
    if (overlayEl) {
      overlayEl.addEventListener('mouseenter', onMouseEnter)
      overlayEl.addEventListener('mouseleave', onMouseLeave)
    }

    return () => {
      if (overlayEl) {
        overlayEl.removeEventListener('mouseenter', onMouseEnter)
        overlayEl.removeEventListener('mouseleave', onMouseLeave)
      }
    }
  }, [onMouseEnter, onMouseLeave])

  return (
    <div
      className="overlay"
      ref={overlayRef}
      style={{
        opacity: showOverlay ? 1 : 0,
        pointerEvents: showOverlay ? 'auto' : 'none',
      }}
    />
  )
}

export default Overlay
