'use client'

import { NavGroup, SidebarRow, useNav } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export const ComponentsNavLink: React.FC = () => {
  const pathname = usePathname()
  const { navOpen } = useNav()
  const isActive = pathname === '/admin/components'

  return (
    <NavGroup label="Component Gallery">
      <SidebarRow
        as={Link}
        href="/admin/components"
        selected={isActive}
        tabIndex={navOpen ? 0 : -1}
        title="UI"
      />
    </NavGroup>
  )
}
