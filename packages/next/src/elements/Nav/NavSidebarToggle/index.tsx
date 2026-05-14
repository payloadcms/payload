'use client'
import { SidebarToggle, useNav } from '@payloadcms/ui'
import React from 'react'

/**
 * @internal
 */
export const NavSidebarToggle: React.FC<{
  baseClass?: string
}> = ({ baseClass }) => {
  const { navOpen, setNavOpen } = useNav()

  return (
    <button
      className={`${baseClass}__mobile-close`}
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
