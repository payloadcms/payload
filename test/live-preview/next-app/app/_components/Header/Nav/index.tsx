'use client'

import React from 'react'

import { Header as HeaderType } from '../../../../payload-types'
import { CMSLink } from '../../Link'

import classes from './index.module.scss'

export type HeaderNavProps = {
  header: HeaderType
}

export const HeaderNav = ({ header }: HeaderNavProps) => {
  const navItems = header?.navItems || []

  return (
    <nav className={classes.nav}>
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} />
      })}
    </nav>
  )
}
