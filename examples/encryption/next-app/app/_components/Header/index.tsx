import React from 'react';
import { CMSLink } from '../Link';
import { HeaderBar } from './HeaderBar';
import { MainMenu } from '../../../payload-types';
import { MobileMenuModal } from './MobileMenuModal';

import classes from './index.module.scss';


export async function Header() {
  const mainMenu: MainMenu = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/globals/main-menu`,
  ).then(res => res.json())

  const { navItems } = mainMenu

  const hasNavItems = navItems && Array.isArray(navItems) && navItems.length > 0

  return (
    <>
      <HeaderBar>
        {hasNavItems && (
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
