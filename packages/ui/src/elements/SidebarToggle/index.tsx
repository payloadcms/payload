'use client'
import React, { useState } from 'react'

import { SidebarIcon } from '../../icons/Sidebar/index.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.css'

const baseClass = 'sidebar-toggle'

export const SidebarToggle: React.FC<{
  readonly isActive?: boolean
}> = ({ isActive = false }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  // TODO: translations
  const label = isActive ? 'Hide Sidebar' : 'Show Sidebar'

  return (
    <div
      className={baseClass}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="presentation"
    >
      <SidebarIcon />
      <Tooltip
        alignCaret="left"
        className={`${baseClass}__tooltip`}
        delay={300}
        position="bottom"
        show={showTooltip}
        staticPositioning
      >
        {label}
      </Tooltip>
    </div>
  )
}
