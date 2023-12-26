import React, { Fragment } from 'react'

import type { Props } from './types'

import { AppHeader } from '../../elements/Header'
import { Nav as DefaultNav } from '../../elements/Nav'
import { NavToggler } from '../../elements/Nav/NavToggler'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
import './index.scss'
import { NavHamburger } from './NavHamburger'
import { NavWrapper } from './NavWrapper'

const baseClass = 'template-default'

export const Default: React.FC<Props> = async ({ children, className, config: configPromise }) => {
  const config = await configPromise

  const {
    admin: {
      components: { Nav: CustomNav } = {
        Nav: undefined,
      },
    } = {},
  } = config

  return (
    <Fragment>
      <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
        <NavToggler className={`${baseClass}__nav-toggler`}>
          <NavHamburger />
        </NavToggler>
      </div>
      <NavWrapper className={className} baseClass={baseClass}>
        <RenderCustomComponent CustomComponent={CustomNav} DefaultComponent={DefaultNav} />
        <div className={`${baseClass}__wrap`}>
          <AppHeader />
          {children}
        </div>
      </NavWrapper>
    </Fragment>
  )
}
