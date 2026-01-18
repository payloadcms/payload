'use client'
import type { ClientUser } from 'payload'

import React, { useState } from 'react'

import { LockIcon } from '../../icons/Lock/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isClientUserObject } from '../../utilities/isClientUserObject.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.scss'

const baseClass = 'locked'

export const Locked: React.FC<{
  className?: string
  user: ClientUser
}> = ({ className, user }) => {
  const [hovered, setHovered] = useState(false)
  const { t } = useTranslation()

  const userToUse = isClientUserObject(user) ? (user.email ?? user.id) : t('general:anotherUser')

  return (
    <div
      className={[baseClass, className].filter(Boolean).join(' ')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
    >
      <Tooltip
        alignCaret="left"
        className={`${baseClass}__tooltip`}
        position="top"
        show={hovered}
      >{`${userToUse} ${t('general:isEditing')}`}</Tooltip>
      <LockIcon />
    </div>
  )
}
