'use client'

import React from 'react'

import type { Header as HeaderType } from '../../../../../test/live-preview/payload-types.js'

import { CMSLink } from '../../Link/index.js'
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
