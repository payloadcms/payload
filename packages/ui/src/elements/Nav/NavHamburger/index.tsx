'use client'
import React from 'react'
import { Hamburger } from '../../Hamburger'
import { useNav } from '../context'

export const NavHamburger: React.FC<{
  baseClass?: string
}> = ({ baseClass }) => {
  const { setNavOpen, navOpen } = useNav()

  return (
    <button
      className={`${baseClass}__mobile-close`}
      onClick={() => {
        setNavOpen(false)
      }}
      tabIndex={!navOpen ? -1 : undefined}
      type="button"
    >
      <Hamburger isActive />
    </button>
  )
}
