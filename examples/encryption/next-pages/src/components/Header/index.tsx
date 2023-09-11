import React from 'react';
import { useGlobals } from '../../providers/Globals';
import { CMSLink } from '../Link';
import { Gutter } from '../Gutter';
import { MenuIcon } from '../icons/Menu';
import { Logo } from '../Logo';
import { MobileMenuModal, slug as menuModalSlug } from './MobileMenuModal';
import { ModalToggler } from '@faceless-ui/modal';
import Link from 'next/link';

import classes from './index.module.scss';

type HeaderBarProps = {
  children?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ children }) => {
  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/">
          <a>
            <Logo />
          </a>
        </Link>

        {children}

        <ModalToggler slug={menuModalSlug} className={classes.mobileMenuToggler}>
          <MenuIcon />
        </ModalToggler>
      </Gutter>
    </header>
  )
}

export const Header: React.FC = () => {
  const { mainMenu: { navItems } } = useGlobals();

  return (
    <>
      <HeaderBar>
        {navItems && (
          <nav className={classes.nav}>
            {navItems.map(({ link }, i) => {
              return <CMSLink key={i} {...link} />
            })}
          </nav>
        )}
      </HeaderBar>
      <MobileMenuModal navItems={navItems} />
    </>
  )
}
