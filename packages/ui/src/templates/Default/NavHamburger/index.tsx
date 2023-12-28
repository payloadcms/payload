'use client'
import React from 'react'
import { Hamburger } from '../../../elements/Hamburger'
import { useNav } from '../../../elements/Nav/context'

export const NavHamburger: React.FC = () => {
  const { navOpen } = useNav()
  return <Hamburger closeIcon="collapse" isActive={navOpen} />
}
