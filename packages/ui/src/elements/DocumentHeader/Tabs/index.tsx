import type {
  ComponentRenderer,
  DocumentTabClientProps,
  DocumentTabServerPropsOnly,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from 'payload'

import React from 'react'

import { RenderClientComponent } from '../../RenderServerComponent/clientOnly.js'
import { ShouldRenderTabs } from './ShouldRenderTabs.js'
import { DefaultDocumentTab } from './Tab/index.js'
import { getTabs } from './tabs/index.js'
import './index.scss'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<{
  collectionConfig: SanitizedCollectionConfig
  globalConfig: SanitizedGlobalConfig
  permissions: SanitizedPermissions
  renderComponent?: ComponentRenderer
  req: PayloadRequest
}> = ({ collectionConfig, globalConfig, permissions, renderComponent, req }) => {
  const { config } = req.payload

  const tabs = getTabs({
    collectionConfig,
    globalConfig,
  })

  return (
    <ShouldRenderTabs>
      <div className={baseClass}>
        <div className={`${baseClass}__tabs-container`}>
          <ul className={`${baseClass}__tabs`}>
            {tabs?.map(({ tab: tabConfig, viewPath }, index) => {
              const { condition } = tabConfig || {}

              const meetsCondition =
                !condition ||
                condition({ collectionConfig, config, globalConfig, permissions, req })

              if (!meetsCondition) {
                return null
              }

              const render: ComponentRenderer = renderComponent || RenderClientComponent
              if (tabConfig?.Component) {
                return render({
                  clientProps: {
                    path: viewPath,
                  } satisfies DocumentTabClientProps,
                  Component: tabConfig.Component,
                  importMap: req.payload.importMap,
                  key: `tab-${index}`,
                  serverProps: {
                    collectionConfig,
                    globalConfig,
                    i18n: req.i18n,
                    payload: req.payload,
                    permissions,
                    renderComponent: render,
                    req,
                    user: req.user,
                  } satisfies DocumentTabServerPropsOnly,
                })
              }

              return (
                <DefaultDocumentTab
                  collectionConfig={collectionConfig}
                  globalConfig={globalConfig}
                  key={`tab-${index}`}
                  path={viewPath}
                  permissions={permissions}
                  renderComponent={renderComponent}
                  req={req}
                  tabConfig={tabConfig}
                />
              )
            })}
          </ul>
        </div>
      </div>
    </ShouldRenderTabs>
  )
}
