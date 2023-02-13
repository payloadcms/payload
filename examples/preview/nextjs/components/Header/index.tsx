import Link from 'next/link';
import React, { useState } from 'react';
import { useGlobals } from '../../providers/Globals';
import { Gutter } from '../Gutter';
import { Logo } from '../Logo';
import { PayloadAdminBarProps, PayloadMeUser } from 'payload-admin-bar';

import classes from './index.module.scss';
import { AdminBar } from './AdminBar';
import { CMSLink } from '../CMSLink';

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
    </div>
  )
}
