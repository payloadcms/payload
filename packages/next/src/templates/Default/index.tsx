import type { ServerProps, VisibleEntities } from 'payload'

import { AppHeader, EntityVisibilityProvider, NavToggler } from '@payloadcms/ui/client'
import { RenderCustomComponent } from '@payloadcms/ui/shared'
import React from 'react'

import { DefaultNav, type NavProps } from '../../elements/Nav/index.js'
import { NavHamburger } from './NavHamburger/index.js'
import { Wrapper } from './Wrapper/index.js'
import './index.scss'

const baseClass = 'template-default'

export type DefaultTemplateProps = ServerProps & {
  children?: React.ReactNode
  className?: string
  visibleEntities: VisibleEntities
}

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({
  children,
  className,
  i18n,
  locale,
  params,
  payload,
  permissions,
  searchParams,
  user,
  visibleEntities,
}) => {
  const {
    admin: {
      components: { Nav: CustomNav } = {
        Nav: undefined,
      },
    } = {},
  } = payload.config || {}

  const navProps: NavProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user,
  }

  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      <div>
        <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
          <NavToggler className={`${baseClass}__nav-toggler`}>
            <NavHamburger />
          </NavToggler>
        </div>
        <Wrapper baseClass={baseClass} className={className}>
          <RenderCustomComponent
            CustomComponent={CustomNav}
            DefaultComponent={DefaultNav}
            componentProps={navProps}
            serverOnlyProps={{
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            }}
          />
          <div className={`${baseClass}__wrap`}>
            <AppHeader />
            {children}
          </div>
        </Wrapper>
      </div>
    </EntityVisibilityProvider>
  )
}
