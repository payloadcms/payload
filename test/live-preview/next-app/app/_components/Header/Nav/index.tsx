'use client'

import React from 'react'

import { Header as HeaderType } from '../../../../payload-types'
import { CMSLink } from '../../Link'

import classes from './index.module.scss'

export const HeaderNav: React.FC<{ header: HeaderType }> = ({ header }) => {
  const navItems = header?.navItems || []

  return (
    <nav className={classes.nav}>
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} />
      })}
    </nav>
  )
}
