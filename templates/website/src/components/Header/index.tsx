'use client'

import React from 'react'
import { ModalToggler } from '@faceless-ui/modal'
import Link from 'next/link'

import { Header as HeaderType } from '../../payload-types'
import { Gutter } from '../Gutter'
import { MenuIcon } from '../icons/Menu'
import { CMSLink } from '../Link'
import { Logo } from '../Logo'
import { MobileMenuModal, slug as menuModalSlug } from './MobileMenuModal'

import classes from './index.module.scss'

export const Header: React.FC<HeaderType> = props => {
  const { navItems } = props

  const hasNavItems = Array.isArray(navItems) && navItems.length > 0

  return (
    <>
      <header className={classes.header}>
        <Gutter className={classes.wrap}>
          <Link href="/">
            <Logo />
          </Link>
          <nav className={classes.nav}>
            {hasNavItems &&
              navItems.map(({ link }, i) => {
                return <CMSLink key={i} {...link} />
              })}
          </nav>
          <ModalToggler slug={menuModalSlug} className={classes.mobileMenuToggler}>
            <MenuIcon />
          </ModalToggler>
        </Gutter>
      </header>
      <MobileMenuModal navItems={navItems} />
    </>
  )
}
