'use client'

import { NavGroup, useNav } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import './NavLink.css'

export const IconsNavLink: React.FC = () => {
  const pathname = usePathname()
  const { navOpen } = useNav()
  const isActive = pathname === '/admin/icons'

  return (
    <NavGroup label="Dev Tools">
      <Link
        className={['icons-nav-link', isActive && 'icons-nav-link--active']
          .filter(Boolean)
          .join(' ')}
        href="/admin/icons"
        tabIndex={navOpen ? 0 : -1}
      >
        Icons
      </Link>
    </NavGroup>
  )
}
