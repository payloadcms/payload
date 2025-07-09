import type { I18n } from '@payloadcms/translations'
import type {
  DocumentTabClientProps,
  DocumentTabServerPropsOnly,
  Payload,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { ShouldRenderTabs } from './ShouldRenderTabs.js'
import { DocumentTab } from './Tab/index.js'
import { getTabs } from './tabs/index.js'
import './index.scss'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<{
  collectionConfig: SanitizedCollectionConfig
  globalConfig: SanitizedGlobalConfig
  i18n: I18n
  payload: Payload
  permissions: SanitizedPermissions
}> = (props) => {
  const { collectionConfig, globalConfig, i18n, payload, permissions } = props
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
            {tabs?.map(({ tab, viewPath }, index) => {
              const { condition } = tab || {}

              const meetsCondition =
                !condition || condition({ collectionConfig, config, globalConfig, permissions })

              if (!meetsCondition) {
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
