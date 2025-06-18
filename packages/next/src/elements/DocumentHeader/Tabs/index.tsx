import type { I18n } from '@payloadcms/translations'
import type {
  Data,
  DocumentTabClientProps,
  DocumentTabServerPropsOnly,
  Payload,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { ShouldRenderTabs } from './ShouldRenderTabs.js'
import { DocumentTab } from './Tab/index.js'
import './index.scss'
import { getTabs } from './tabs/index.js'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<{
  collectionConfig: SanitizedCollectionConfig
  doc: Data
  globalConfig: SanitizedGlobalConfig
  i18n: I18n
  payload: Payload
  permissions: SanitizedPermissions
  req?: PayloadRequest
}> = (props) => {
  const { collectionConfig, doc, globalConfig, i18n, payload, permissions, req } = props
  const { config } = payload

  const tabs = getTabs({
    collectionConfig,
    globalConfig,
  })

  return (
    <ShouldRenderTabs>
      <div className={baseClass}>
        <div className={`${baseClass}__tabs-container`}>
          <ul className={`${baseClass}__tabs`}>
            {tabs?.map(({ name, tab, viewPath }, index) => {
              const { condition } = tab || {}
              const meetsCondition =
                !condition || condition({ collectionConfig, config, globalConfig, permissions })

              let viewConfig

              if (collectionConfig) {
                if (typeof collectionConfig?.admin?.components?.views?.edit === 'object') {
                  viewConfig = collectionConfig.admin.components.views.edit[name]
                }
              } else if (globalConfig) {
                if (typeof globalConfig?.admin?.components?.views?.edit === 'object') {
                  viewConfig = globalConfig.admin.components.views.edit[name]
                }
              }

              const { condition: viewCondition } = viewConfig || {}

              const meetsViewCondition =
                !viewCondition ||
                viewCondition({
                  doc,
                  req,
                })

              if (!meetsCondition || !meetsViewCondition) {
                return null
              }

              if (tab?.Component) {
                return RenderServerComponent({
                  clientProps: {
                    path: viewPath,
                  } satisfies DocumentTabClientProps,
                  Component: tab.Component,
                  importMap: payload.importMap,
                  key: `tab-${index}`,
                  serverProps: {
                    collectionConfig,
                    globalConfig,
                    i18n,
                    payload,
                    permissions,
                  } satisfies DocumentTabServerPropsOnly,
                })
              }

              return (
                <DocumentTab
                  key={`tab-${index}`}
                  path={viewPath}
                  {...{
                    ...props,
                    ...tab,
                  }}
                />
              )
            })}
          </ul>
        </div>
      </div>
    </ShouldRenderTabs>
  )
}
