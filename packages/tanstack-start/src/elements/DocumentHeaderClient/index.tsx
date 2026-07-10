'use client'

import type { DocumentTabConfig, ImportMap } from 'payload'

import { Gutter, RenderTitle, useAuth, useConfig, useTranslation } from '@payloadcms/ui'
import '@payloadcms/ui/elements/DocumentHeader/index.scss'
import '@payloadcms/ui/elements/DocumentHeader/Tabs/index.scss'
import '@payloadcms/ui/elements/DocumentHeader/Tabs/Tab/index.scss'
import { ShouldRenderTabs } from '@payloadcms/ui/elements/DocumentHeader/Tabs/ShouldRenderTabs'
import { DocumentTabLink } from '@payloadcms/ui/elements/DocumentHeader/Tabs/Tab/TabLink'
import { getTabs } from '@payloadcms/ui/elements/DocumentHeader/Tabs/tabs'
import { RenderClientComponent } from '@payloadcms/ui/elements/RenderServerComponent/clientOnly'
import React, { Fragment } from 'react'

const baseClass = 'doc-header'
const tabBaseClass = 'doc-tab'

/**
 * Client-only DocumentHeader for non-RSC adapters.
 * Uses hooks to obtain config, permissions, and i18n instead of requiring `req`.
 */
export function DocumentHeaderClient({
  collectionSlug,
  globalSlug,
  hideTabs,
  importMap,
}: {
  collectionSlug?: string
  globalSlug?: string
  hideTabs?: boolean
  importMap: ImportMap
}) {
  const { config, getEntityConfig } = useConfig()
  const { permissions } = useAuth()
  const { t } = useTranslation()

  const collectionConfig = collectionSlug ? getEntityConfig({ collectionSlug }) : null
  const globalConfig = globalSlug ? getEntityConfig({ globalSlug }) : null

  const tabs = getTabs({
    collectionConfig: collectionConfig as any,
    globalConfig: globalConfig as any,
  })

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__header`}>
        <RenderTitle className={`${baseClass}__title`} />
        {!hideTabs && (
          <ShouldRenderTabs>
            <div className="doc-tabs">
              <div className="doc-tabs__tabs-container">
                <ul className="doc-tabs__tabs">
                  {tabs?.map(({ tab: tabConfig, viewPath }, index) => {
                    if (tabConfig?.condition) {
                      const meetsCondition = tabConfig.condition({
                        collectionConfig: collectionConfig as any,
                        config: config as any,
                        globalConfig: globalConfig as any,
                        permissions: permissions ?? ({} as any),
                        req: undefined as any,
                      })
                      if (!meetsCondition) {
                        return null
                      }
                    }

                    if (tabConfig?.Component) {
                      return (
                        <RenderClientComponent
                          clientProps={{ path: viewPath }}
                          Component={tabConfig.Component}
                          importMap={importMap}
                          key={`tab-${index}`}
                        />
                      )
                    }

                    const label =
                      typeof tabConfig.label === 'function'
                        ? tabConfig.label({ t: t as any })
                        : ((tabConfig.label as string) ?? '')

                    let href: string
                    if (typeof tabConfig.href === 'function') {
                      href = tabConfig.href({
                        apiURL: undefined as any,
                        collection: collectionConfig as any,
                        global: globalConfig as any,
                        routes: config.routes as any,
                      })
                    } else {
                      href = (tabConfig.href as string) ?? ''
                    }

                    const { Pill, Pill_Component } = tabConfig as {
                      Pill?: DocumentTabConfig['Pill']
                      Pill_Component?: React.FC
                    }

                    return (
                      <DocumentTabLink
                        adminRoute={config.routes.admin}
                        ariaLabel={label}
                        baseClass={tabBaseClass}
                        href={href}
                        key={`tab-${index}`}
                        newTab={tabConfig.newTab}
                      >
                        <span className={`${tabBaseClass}__label`}>
                          {label}
                          {Pill || Pill_Component ? (
                            <Fragment>
                              &nbsp;
                              {RenderClientComponent({
                                Component: Pill,
                                Fallback: Pill_Component,
                                importMap,
                              })}
                            </Fragment>
                          ) : null}
                        </span>
                      </DocumentTabLink>
                    )
                  })}
                </ul>
              </div>
            </div>
          </ShouldRenderTabs>
        )}
      </div>
    </Gutter>
  )
}
