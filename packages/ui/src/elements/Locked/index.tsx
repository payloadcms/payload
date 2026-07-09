'use client'
import type { ClientUser } from 'payload'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { LockIcon } from '../../icons/Lock/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isClientUserObject } from '../../utilities/isClientUserObject.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.css'

const baseClass = 'locked'

type AnchorRect = {
  height: number
  left: number
  top: number
  width: number
}

export const Locked: React.FC<{
  className?: string
  user: ClientUser
}> = ({ className, user }) => {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null)
  const { t } = useTranslation()

  const userToUse = isClientUserObject(user) ? (user.email ?? user.id) : t('general:anotherUser')

  const updateAnchorRect = useCallback(() => {
    const node = anchorRef.current

    if (!node) {
      return
    }

    const { height, left, top, width } = node.getBoundingClientRect()
    setAnchorRect({ height, left, top, width })
  }, [])

  useEffect(() => {
    if (!hovered) {
      return
    }

    updateAnchorRect()

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
      className={[baseClass, className].filter(Boolean).join(' ')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={anchorRef}
      role="button"
      tabIndex={0}
    >
      <LockIcon />
      {hovered &&
        anchorRect &&
        typeof document !== 'undefined' &&
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
            <Tooltip
              alignCaret="center"
              className={`${baseClass}__tooltip`}
              position="bottom"
              show={hovered}
            >{`${userToUse} ${t('general:isEditing')}`}</Tooltip>
          </div>,
          document.body,
        )}
    </div>
  )
}
