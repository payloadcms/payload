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
  const { navOpen, navToggleRef, setNavOpen } = useNav()
  const { t } = useTranslation()
  const shouldReturnFocus = React.useRef(false)

  React.useEffect(() => {
    if (!navOpen && shouldReturnFocus.current) {
      shouldReturnFocus.current = false
      navToggleRef?.current?.focus({ preventScroll: true })
    }
  }, [navOpen, navToggleRef])

  return (
    <button
      aria-expanded={navOpen}
      aria-label={t('general:hideSidebar')}
      className={`${baseClass}__close`}
      onClick={() => {
        shouldReturnFocus.current = true
        setNavOpen(false, true)
      }}
      tabIndex={!navOpen ? -1 : undefined}
      type="button"
    >
      <SidebarToggle isActive />
    </button>
  )
}
