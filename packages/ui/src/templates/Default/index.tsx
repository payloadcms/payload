import React, { Fragment } from 'react'

import type { Props } from './types'

import { AppHeader } from '../../elements/Header'
import { DefaultNav } from '../../elements/Nav'
import { NavToggler } from '../../elements/Nav/NavToggler'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
import { NavHamburger } from './NavHamburger'
import { Wrapper } from './Wrapper'

import './index.scss'

const baseClass = 'template-default'

export const DefaultTemplate: React.FC<Props> = async ({
  children,
  className,
  config: configPromise,
  user,
  permissions,
  i18n,
}) => {
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
      <Wrapper className={className} baseClass={baseClass}>
        <RenderCustomComponent
          CustomComponent={CustomNav}
          DefaultComponent={DefaultNav}
          componentProps={{
            config,
            user,
            permissions,
            i18n,
          }}
        />
        <div className={`${baseClass}__wrap`}>
          <AppHeader />
          {children}
        </div>
      </Wrapper>
    </Fragment>
  )
}
