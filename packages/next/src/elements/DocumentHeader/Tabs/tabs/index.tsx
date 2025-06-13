import type { DocumentTabConfig, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import { VersionsPill } from './VersionsPill/index.js'

export const documentViewKeys = ['api', 'default', 'livePreview', 'versions']

export type DocumentViewKey = (typeof documentViewKeys)[number]

export const getTabs = ({
  collectionConfig,
  globalConfig,
}: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
}): { tab: DocumentTabConfig; viewPath: string }[] => {
  const customViews =
    collectionConfig?.admin?.components?.views?.edit ||
    globalConfig?.admin?.components?.views?.edit ||
    {}

  return [
    {
      tab: {
        href: '',
        label: ({ t }) => t('general:edit'),
        order: 100,
        ...(customViews?.['default']?.tab || {}),
      },
      viewPath: '/',
    },
    {
      tab: {
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
        order: 200,
        ...(customViews?.['livePreview']?.tab || {}),
      },
      viewPath: '/preview',
    },
    {
      tab: {
        condition: ({ collectionConfig, globalConfig, permissions }) =>
          Boolean(
            (collectionConfig?.versions &&
              permissions?.collections?.[collectionConfig?.slug]?.readVersions) ||
              (globalConfig?.versions && permissions?.globals?.[globalConfig?.slug]?.readVersions),
          ),
        href: '/versions',
        label: ({ t }) => t('version:versions'),
        order: 300,
        Pill_Component: VersionsPill,
        ...(customViews?.['versions']?.tab || {}),
      },
      viewPath: '/versions',
    },
    {
      tab: {
        condition: ({ collectionConfig, globalConfig }) =>
          (collectionConfig && !collectionConfig?.admin?.hideAPIURL) ||
          (globalConfig && !globalConfig?.admin?.hideAPIURL),
        href: '/api',
        label: 'API',
        order: 400,
        ...(customViews?.['api']?.tab || {}),
      },
      viewPath: '/api',
    },
  ]
    .concat(
      Object.entries(customViews).reduce((acc, [key, value]) => {
        if (documentViewKeys.includes(key)) {
          return acc
        }

        if (value?.tab) {
          acc.push({
            tab: value.tab,
            viewPath: 'path' in value ? value.path : '',
          })
        }

        return acc
      }, []),
    )
    ?.sort(({ tab: a }, { tab: b }) => {
      if (a.order === undefined && b.order === undefined) {
        return 0
      } else if (a.order === undefined) {
        return 1
      } else if (b.order === undefined) {
        return -1
      }

      return a.order - b.order
    })
}
