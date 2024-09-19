'use client'
import type { ClientUser } from 'payload'

import React, { useState } from 'react'

import { useTableCell } from '../../elements/Table/TableCellProvider/index.js'
import { LockIcon } from '../../icons/Lock/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.scss'

const baseClass = 'locked'

export const Locked: React.FC<{ className?: string; user: ClientUser }> = ({ className, user }) => {
  const { rowData } = useTableCell()
  const [hovered, setHovered] = useState(false)
  const { t } = useTranslation()

  const userToUse = user ? (user?.email ?? user?.id) : rowData?.id

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
