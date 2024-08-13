import type { ServerProps, VisibleEntities } from 'payload'

import { AppHeader, EntityVisibilityProvider, NavToggler } from '@payloadcms/ui'
import { RenderCustomComponent, WithServerSideProps } from '@payloadcms/ui/shared'
import React from 'react'

import { DefaultNav, type NavProps } from '../../elements/Nav/index.js'
import { NavHamburger } from './NavHamburger/index.js'
import { Wrapper } from './Wrapper/index.js'
import './index.scss'

const baseClass = 'template-default'

export type DefaultTemplateProps = {
  children?: React.ReactNode
  className?: string
  visibleEntities: VisibleEntities
} & ServerProps

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
      components: { Nav: CustomNav, header } = {
        Nav: undefined,
        header: undefined,
      },
    } = {},
  } = payload.config || {}

  const CustomHeader = Array.isArray(header)
    ? header.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
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
      ))
    : null

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
      {CustomHeader && Array.isArray(CustomHeader) && CustomHeader.map((Component) => Component)}
      <div style={{ position: 'relative' }}>
        <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
          <div className={`${baseClass}__nav-toggler`}>
            <NavToggler>
              <NavHamburger />
            </NavToggler>
          </div>
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
