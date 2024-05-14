import type { Payload, SanitizedConfig, VisibleEntities } from 'payload/types'

import { EntityVisibilityProvider } from '@payloadcms/ui/providers/EntityVisibility'
import React from 'react'

import type { NavProps } from '../../elements/Nav/index.js'

import { AppHeader } from '../../elements/AppHeader/index.js'
import { NavToggler } from '../../elements/Nav/NavToggler/index.js'
import { DefaultNav } from '../../elements/Nav/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { NavHamburger } from './NavHamburger/index.js'
import { Wrapper } from './Wrapper/index.js'
import './index.scss'

const baseClass = 'template-default'

export type DefaultTemplateProps = {
  children?: React.ReactNode
  className?: string
  payload: Payload
  visibleEntities?: VisibleEntities
}

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({
  children,
  className,
  payload,
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
    payload,
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
            payload={payload}
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
