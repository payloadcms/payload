'use client'
import React from 'react'

import { Hamburger } from '../../../elements/Hamburger/index.js'
import { useNav } from '../../../elements/Nav/context.js'

export const NavHamburger: React.FC = () => {
  const { navOpen } = useNav()
  return <Hamburger closeIcon="collapse" isActive={navOpen} />
}
