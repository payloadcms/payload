import type { ServerProps, VisibleEntities } from 'payload'

import { AppHeader, BulkUploadProvider, EntityVisibilityProvider, NavToggler } from '@payloadcms/ui'
import { RenderComponent } from '@payloadcms/ui/shared'
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

  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      <BulkUploadProvider>
        <RenderComponent
          clientProps={{ clientProps: { visibleEntities } }}
          Component={CustomHeader}
          Fallback={AppHeader}
          importMap={payload.importMap}
          serverProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
            visibleEntities,
          }}
        />
        <div style={{ position: 'relative' }}>
          <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
            <div className={`${baseClass}__nav-toggler-container`} id="nav-toggler">
              <NavToggler className={`${baseClass}__nav-toggler`}>
                <NavHamburger />
              </NavToggler>
            </div>
          </div>
          <Wrapper baseClass={baseClass} className={className}>
            <RenderComponent
              clientProps={{ clientProps: { visibleEntities } }}
              Component={CustomNav}
              Fallback={DefaultNav}
              importMap={payload.importMap}
              serverProps={{
                i18n,
                locale,
                params,
                payload,
                permissions,
                searchParams,
                user,
                visibleEntities,
              }}
            />
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
