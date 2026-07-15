'use client'
import type { User } from 'payload'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { LockIcon } from '../../icons/Lock/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isClientUserObject } from '../../utilities/isClientUserObject.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.css'

const baseClass = 'locked'

export const Locked: React.FC<{
  className?: string
  user: User
}> = ({ className, user }) => {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const { t } = useTranslation()

  const userToUse = isClientUserObject(user) ? (user.email ?? user.id) : t('general:anotherUser')
  const tooltipLabel = `${userToUse} ${t('general:isEditing')}`

  const updateAnchorRect = useCallback(() => {
    const node = anchorRef.current

    if (!node) {
      return
    }

    setAnchorRect(node.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!hovered) {
      return
    }

    // Keep the portaled tooltip aligned to the icon as the page or an overflow
    // container scrolls.
    window.addEventListener('scroll', updateAnchorRect, true)
    window.addEventListener('resize', updateAnchorRect)

    return () => {
      window.removeEventListener('scroll', updateAnchorRect, true)
      window.removeEventListener('resize', updateAnchorRect)
    }
  }, [hovered, updateAnchorRect])

  return (
    <div
      aria-label={tooltipLabel}
      className={[baseClass, className].filter(Boolean).join(' ')}
      onBlur={() => setHovered(false)}
      onFocus={() => {
        updateAnchorRect()
        setHovered(true)
      }}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault() // prevent page scroll when focused
        }
      }}
      onMouseEnter={() => {
        updateAnchorRect()
        setHovered(true)
      }}
      onMouseLeave={() => setHovered(false)}
      ref={anchorRef}
      role="button"
      tabIndex={0}
    >
      <LockIcon />
      {hovered &&
        anchorRect &&
        createPortal(
          <div
            className={`${baseClass}__tooltip-anchor`}
            style={{
              height: anchorRect.height,
              left: anchorRect.left,
              top: anchorRect.top,
              width: anchorRect.width,
            }}
          >
            <Tooltip alignCaret="center" className={`${baseClass}__tooltip`} position="bottom" show>
              {tooltipLabel}
            </Tooltip>
          </div>,
          document.body,
        )}
    </div>
  )
}
