'use client'
import React, { Fragment } from 'react'

import type { Props } from './types'

import { Hamburger } from '../../elements/Hamburger'
import { AppHeader } from '../../elements/Header'
import { Nav as DefaultNav } from '../../elements/Nav'
import { NavToggler } from '../../elements/Nav/NavToggler'
import { useNav } from '../../elements/Nav/context'
import { useConfig } from '../../providers/Config'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
import './index.scss'

const baseClass = 'template-default'

export const Default: React.FC<Props> = ({ children, className, Link }) => {
  const {
    admin: {
      components: { Nav: CustomNav } = {
        Nav: undefined,
      },
    } = {},
  } = useConfig()

  const { navOpen } = useNav()

  return (
    <Fragment>
      <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
        <NavToggler className={`${baseClass}__nav-toggler`}>
          <Hamburger closeIcon="collapse" isActive={navOpen} />
        </NavToggler>
      </div>
      <div
        className={[baseClass, className, navOpen && `${baseClass}--nav-open`]
          .filter(Boolean)
          .join(' ')}
      >
        <RenderCustomComponent CustomComponent={CustomNav} DefaultComponent={DefaultNav} />
        <div className={`${baseClass}__wrap`}>
          <AppHeader Link={Link} />
          {children}
        </div>
      </div>
    </Fragment>
  )
}
