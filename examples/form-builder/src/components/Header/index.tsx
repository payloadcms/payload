import { ModalToggler } from '@faceless-ui/modal'
import Link from 'next/link'
import React from 'react'

import type { MainMenu } from '../../payload-types'

import { getCachedGlobal } from '../../utilities/getGlobals'
import { Gutter } from '../Gutter'
import { MenuIcon } from '../icons/Menu'
import { CMSLink } from '../Link'
import { Logo } from '../Logo'
import classes from './index.module.scss'
import { slug as menuModalSlug, MobileMenuModal } from './MobileMenuModal'

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

export async function Header() {
  const header: MainMenu = await getCachedGlobal('main-menu', 1)()

  const navItems = header?.navItems || []

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
