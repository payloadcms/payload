'use client'

import { NavGroup, SidebarRow, useNav } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export const IconsNavLink: React.FC = () => {
  const pathname = usePathname()
  const { navOpen } = useNav()
  const isActive = pathname === '/admin/icons'

  return (
    <NavGroup label="Dev Tools">
      <SidebarRow
        as={Link}
        href="/admin/icons"
        selected={isActive}
        tabIndex={navOpen ? 0 : -1}
        title="Icons"
      />
    </NavGroup>
  )
}
