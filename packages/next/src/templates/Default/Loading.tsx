import {
  ActionsProvider,
  AppHeader,
  BulkUploadProvider,
  EntityVisibilityProvider,
  NavToggler,
} from '@payloadcms/ui'

import './index.scss'

import React from 'react'

import { DefaultNavLoading } from '../../elements/Nav/Loading.js'
import { NavHamburger } from './NavHamburger/index.js'
import { Wrapper } from './Wrapper/index.js'

const baseClass = 'template-default'

type DefaultTemplateLoaderProps = {
  children?: React.ReactNode
  className?: string
}

export const DefaultTemplateLoading: React.FC<DefaultTemplateLoaderProps> = ({
  children,
  className,
}) => {
  return (
    <EntityVisibilityProvider
      visibleEntities={{
        collections: [],
        globals: [],
      }}
    >
      <BulkUploadProvider>
        <ActionsProvider Actions={{}}>
          <div style={{ position: 'relative' }}>
            <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
              <div className={`${baseClass}__nav-toggler-container`} id="nav-toggler">
                <NavToggler className={`${baseClass}__nav-toggler`}>
                  <NavHamburger />
                </NavToggler>
              </div>
            </div>
            <Wrapper baseClass={baseClass} className={className}>
              <DefaultNavLoading />
              <div className={`${baseClass}__wrap`}>
                <AppHeader />
                {children}
              </div>
            </Wrapper>
          </div>
        </ActionsProvider>
      </BulkUploadProvider>
    </EntityVisibilityProvider>
  )
}
