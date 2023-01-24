import { ModalToggler } from '@faceless-ui/modal';
import Link from 'next/link';
import React, { useState } from 'react';
import { useGlobals } from '../../providers/Globals';
import { Gutter } from '../Gutter';
import { MenuIcon } from '../icons/Menu';
import { CMSLink } from '../Link';
import { Logo } from '../Logo';
import { MobileMenuModal, slug as menuModalSlug } from './MobileMenuModal';
import { PayloadAdminBarProps, PayloadMeUser } from 'payload-admin-bar';

import classes from './index.module.scss';
import { AdminBar } from './AdminBar';

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

export const Header: React.FC<{
  adminBarProps: PayloadAdminBarProps
}> = (props) => {
  const {
    adminBarProps,
  } = props;

  const [user, setUser] = useState<PayloadMeUser>();

  const { mainMenu: { navItems } } = useGlobals();

  const hasNavItems = navItems && Array.isArray(navItems) && navItems.length > 0;

  return (
    <div>
      <AdminBar
        adminBarProps={adminBarProps}
        user={user}
        setUser={setUser}
      />
      <HeaderBar>
        {hasNavItems && (
          <nav className={classes.nav}>
            {navItems.map(({ link }, i) => {
              return (
                <CMSLink key={i} {...link} />
              )
            })}
          </nav>
        )}
      </HeaderBar>
      {hasNavItems && (
        <MobileMenuModal navItems={navItems} />
      )}
    </div>
  )
}
