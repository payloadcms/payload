'use client'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { MenuSeparator } from '../../MenuSeparator/index.js'

export const SubMenuHeader: React.FC<{
  readonly onBack: () => void
  readonly title: string
}> = ({ onBack, title }) => (
  <div className="user-menu__submenu-header" data-popup-prevent-close>
    <div className="user-menu__submenu-header-wrap">
      <button
        aria-label={title}
        className="user-menu__submenu-header-row"
        onClick={onBack}
        type="button"
      >
        <span className="user-menu__submenu-back">
          <ChevronIcon direction="left" size={24} />
        </span>
        <span className="user-menu__submenu-title">{title}</span>
      </button>
    </div>
    <MenuSeparator />
  </div>
)
