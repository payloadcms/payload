'use client'
import React, { useState } from 'react'

import { SidebarIcon } from '../../icons/Sidebar/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.css'

const baseClass = 'sidebar-toggle'

export const SidebarToggle: React.FC<{
  readonly isActive?: boolean
}> = ({ isActive = false }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const { t } = useTranslation()

  const label = isActive ? t('general:hideSidebar') : t('general:showSidebar')

  return (
    <div
      className={baseClass}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="presentation"
    >
      <SidebarIcon />
      <Tooltip alignCaret="left" delay={300} position="bottom" show={showTooltip} staticPositioning>
        {label}
      </Tooltip>
    </div>
  )
}
