import React from 'react'
import Link from 'next/link'

import { useGlobals } from '../../providers/Globals'
import { CMSLink } from '../CMSLink'
import { Gutter } from '../Gutter'
import { Logo } from '../Logo'

import classes from './index.module.scss'

type HeaderBarProps = {
  children?: React.ReactNode
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ children }) => {
  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/">
          <Logo />
        </Link>
        {children}
      </Gutter>
    </header>
  )
}

export const Header: React.FC = () => {
  const {
    mainMenu: { navItems },
  } = useGlobals()

  return (
    <HeaderBar>
      <nav className={classes.nav}>
        {navItems.map(({ link }, i) => {
          return <CMSLink key={i} {...link} />
        })}
      </nav>
    </HeaderBar>
  )
}
