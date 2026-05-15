'use client'
import React from 'react'

import { useNav } from '../../../elements/Nav/context.js'
import { SidebarToggle } from '../../../elements/SidebarToggle/index.js'

export const NavHamburger: React.FC = () => {
  const { navOpen } = useNav()
  return <SidebarToggle isActive={navOpen} />
}
