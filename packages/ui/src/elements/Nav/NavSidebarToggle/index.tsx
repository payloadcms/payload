'use client'
import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { SidebarToggle } from '../../SidebarToggle/index.js'
import { useNav } from '../context.js'

/**
 * @internal
 */
export const NavSidebarToggle: React.FC<{
  baseClass?: string
}> = ({ baseClass }) => {
  const { navOpen, setNavOpen } = useNav()
  const { t } = useTranslation()

  return (
    <button
      aria-label={t('general:hideSidebar')}
      className={`${baseClass}__close`}
      onClick={() => {
        setNavOpen(false)
      }}
      tabIndex={!navOpen ? -1 : undefined}
      type="button"
    >
      <SidebarToggle isActive />
    </button>
  )
}
