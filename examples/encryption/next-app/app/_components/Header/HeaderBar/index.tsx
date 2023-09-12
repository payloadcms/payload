'use client'

import React from 'react';
import Link from 'next/link';
import { ModalToggler } from '@faceless-ui/modal';
import { Gutter } from '../../Gutter';
import { MenuIcon } from '../../icons/Menu';
import { Logo } from '../../Logo';
import { slug as menuModalSlug } from '../MobileMenuModal';

import classes from './index.module.scss';


type HeaderBarProps = {
  children?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ children }) => {
  return (
    <header className={classes.header}>
      <Gutter className={classes.wrap}>
        <Link href="/">
          <Logo />
        </Link>

        {children}

        <ModalToggler slug={menuModalSlug} className={classes.mobileMenuToggler}>
          <MenuIcon />
        </ModalToggler>
      </Gutter>
    </header>
  )
}
