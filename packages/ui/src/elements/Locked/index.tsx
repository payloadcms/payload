'use client'
import type { User } from 'payload'

import React, { useState } from 'react'

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
  const [hovered, setHovered] = useState(false)
  const { t } = useTranslation()

  const userToUse = isClientUserObject(user) ? (user.email ?? user.id) : t('general:anotherUser')
  const tooltipLabel = `${userToUse} ${t('general:isEditing')}`

  return (
    <div
      aria-label={tooltipLabel}
      className={[baseClass, className].filter(Boolean).join(' ')}
      onBlur={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault() // prevent page scroll when focused
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
    >
      <LockIcon />
      <Tooltip
        alignCaret="center"
        className={`${baseClass}__tooltip`}
        position="bottom"
        show={hovered}
      >
        {tooltipLabel}
      </Tooltip>
    </div>
  )
}
