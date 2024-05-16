'use client'
import { ModalToggler } from '@faceless-ui/modal'
import Link from 'next/link'
import React from 'react'

import { useGlobals } from '../../providers/Globals'
import { Gutter } from '../Gutter'
import { CMSLink } from '../Link'
import { Logo } from '../Logo'
import { MenuIcon } from '../icons/Menu'
import { MobileMenuModal, slug as menuModalSlug } from './MobileMenuModal'
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

        <ModalToggler className={classes.mobileMenuToggler} slug={menuModalSlug}>
          <MenuIcon />
        </ModalToggler>
      </Gutter>
    </header>
  )
}

export const Header: React.FC = () => {
  const {
    mainMenu: { navItems },
  } = useGlobals()

  return (
    <React.Fragment>
      <HeaderBar>
        <nav className={classes.nav}>
          {navItems.map(({ link }, i) => {
            return <CMSLink key={i} {...link} />
          })}
        </nav>
      </HeaderBar>

      <MobileMenuModal navItems={navItems} />
    </React.Fragment>
  )
}
