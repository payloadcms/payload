import type { MappedComponent, ServerProps, VisibleEntities } from 'payload'

import { AppHeader, EntityVisibilityProvider, NavToggler } from '@payloadcms/ui'
import { RenderComponent, getCreateMappedComponent } from '@payloadcms/ui/shared'
import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
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
      components: { Nav: CustomNav } = {
        Nav: undefined,
      },
    } = {},
  } = payload.config || {}

  const createMappedComponent = getCreateMappedComponent({
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const MappedDefaultNav: MappedComponent = createMappedComponent(
    CustomNav,
    undefined,
    DefaultNav,
    'CustomNav',
  )

  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      <div>
        <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
          <NavToggler className={`${baseClass}__nav-toggler`}>
            <NavHamburger />
          </NavToggler>
        </div>
        <Wrapper baseClass={baseClass} className={className}>
          <RenderComponent mappedComponent={MappedDefaultNav} />

          <div className={`${baseClass}__wrap`}>
            <AppHeader />
            {children}
          </div>
        </Wrapper>
      </div>
    </EntityVisibilityProvider>
  )
}
