import type { VisibleEntities } from 'payload'

import React from 'react'

import { AppHeader } from '../../elements/AppHeader/index.js'
import { BulkUploadProvider } from '../../elements/BulkUpload/index.js'
import { NavToggler } from '../../elements/Nav/NavToggler/index.js'
import { ActionsProvider } from '../../providers/Actions/index.js'
import { EntityVisibilityProvider } from '../../providers/EntityVisibility/index.js'
import './index.css'
import { NavHamburger } from './NavHamburger/index.js'
import { Wrapper } from './Wrapper/index.js'

const baseClass = 'template-default'

export type DefaultTemplateProps = {
  Actions?: Record<string, React.ReactNode>
  children?: React.ReactNode
  className?: string
  collectionSlug?: string
  CustomAvatar?: React.ReactNode
  CustomHeader?: React.ReactNode
  CustomIcon?: React.ReactNode
  NavComponent?: React.ReactNode
  visibleEntities: VisibleEntities
}

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({
  Actions = {},
  children,
  className,
  collectionSlug,
  CustomAvatar,
  CustomHeader,
  CustomIcon,
  NavComponent,
  visibleEntities,
}) => {
  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      <BulkUploadProvider drawerSlugPrefix={collectionSlug}>
        <ActionsProvider Actions={Actions}>
          {CustomHeader}
          <div style={{ position: 'relative' }}>
            <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
              <div className={`${baseClass}__nav-toggler-container`} id="nav-toggler">
                <NavToggler className={`${baseClass}__nav-toggler`}>
                  <NavHamburger />
                </NavToggler>
              </div>
            </div>
            <Wrapper baseClass={baseClass} className={className}>
              {NavComponent}
              <div className={`${baseClass}__wrap`}>
                <AppHeader CustomAvatar={CustomAvatar} />
                {children}
              </div>
            </Wrapper>
          </div>
        </ActionsProvider>
      </BulkUploadProvider>
    </EntityVisibilityProvider>
  )
}
