'use client'
import { SidebarToggle, useNav } from '@payloadcms/ui'
import React from 'react'

export const NavSidebarToggle: React.FC = () => {
  const { navOpen } = useNav()
  return <SidebarToggle isActive={navOpen} />
}
