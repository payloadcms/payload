import type { CollectionConfig, DocumentTabConfig, GlobalConfig } from 'payload'
import type React from 'react'

import { VersionsPill } from './VersionsPill/index.js'

export const documentViewKeys = [
  'api',
  'default',
  'livePreview',
  'references',
  'relationships',
  'version',
  'versions',
]

export type DocumentViewKey = (typeof documentViewKeys)[number]

export const tabs = (
  collectionConfig: CollectionConfig,
  globalConfig: GlobalConfig,
): Record<
  DocumentViewKey,
  {
    order?: number
    Pill_Component?: React.FC
  } & DocumentTabConfig
> => {
  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const getOrder = (tabName: string, fallback: number): number =>
    views?.edit?.[tabName] && 'tab' in views.edit[tabName]
      ? (views.edit[tabName].tab?.order ?? fallback)
      : fallback

  return {
    api: {
      condition: ({ collectionConfig, globalConfig }) =>
        (collectionConfig && !collectionConfig?.admin?.hideAPIURL) ||
        (globalConfig && !globalConfig?.admin?.hideAPIURL),
      href: '/api',
      label: 'API',
      order: getOrder('api', 1000),
    },
    default: {
      href: '',
      label: ({ t }) => t('general:edit'),
      order: getOrder('default', 0),
    },
    livePreview: {
      condition: ({ collectionConfig, config, globalConfig }) => {
        if (collectionConfig) {
          return Boolean(
            config?.admin?.livePreview?.collections?.includes(collectionConfig.slug) ||
              collectionConfig?.admin?.livePreview,
          )
        }

        if (globalConfig) {
          return Boolean(
            config?.admin?.livePreview?.globals?.includes(globalConfig.slug) ||
              globalConfig?.admin?.livePreview,
          )
        }

        return false
      },
      href: '/preview',
      label: ({ t }) => t('general:livePreview'),
      order: getOrder('livePreview', 100),
    },
    references: {
      condition: () => false,
    },
    relationships: {
      condition: () => false,
    },
    version: {
      condition: () => false,
    },
    versions: {
      condition: ({ collectionConfig, globalConfig, permissions }) =>
        Boolean(
          (collectionConfig?.versions &&
            permissions?.collections?.[collectionConfig?.slug]?.readVersions) ||
            (globalConfig?.versions && permissions?.globals?.[globalConfig?.slug]?.readVersions),
        ),
      href: '/versions',
      label: ({ t }) => t('version:versions'),
      order: getOrder('versions', 200),
      Pill_Component: VersionsPill,
    },
  }
}
