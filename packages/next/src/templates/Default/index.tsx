import type { MappedComponent, ServerProps, VisibleEntities } from 'payload'

import { AppHeader, BulkUploadProvider, EntityVisibilityProvider, NavToggler } from '@payloadcms/ui'
import { getCreateMappedComponent, RenderComponent } from '@payloadcms/ui/shared'
import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
import './index.scss'
import { NavHamburger } from './NavHamburger/index.js'
import { Wrapper } from './Wrapper/index.js'

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
      components: { header: CustomHeader, Nav: CustomNav } = {
        header: undefined,
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

  const MappedCustomHeader = createMappedComponent(
    CustomHeader,
    undefined,
    undefined,
    'CustomHeader',
  )

  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      <BulkUploadProvider>
        <RenderComponent mappedComponent={MappedCustomHeader} />
        <div style={{ position: 'relative' }}>
          <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
            <div className={`${baseClass}__nav-toggler-container`} id="nav-toggler">
              <NavToggler className={`${baseClass}__nav-toggler`}>
                <NavHamburger />
              </NavToggler>
            </div>
          </div>
          <Wrapper baseClass={baseClass} className={className}>
            <RenderComponent mappedComponent={MappedDefaultNav} />

            <div className={`${baseClass}__wrap`}>
              <AppHeader />
              {children}
            </div>
          </Wrapper>
        </div>
      </BulkUploadProvider>
    </EntityVisibilityProvider>
  )
}
