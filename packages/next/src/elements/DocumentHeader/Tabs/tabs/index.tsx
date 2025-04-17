import type { DocumentTabConfig } from 'payload'
import type React from 'react'

import { isLivePreviewEnabled } from './isLivePreviewEnabled.js'
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

export const tabs: Record<
  DocumentViewKey,
  {
    order?: number // TODO: expose this to the globalConfig config
    Pill_Component?: React.FC
  } & DocumentTabConfig
> = {
  api: {
    condition: ({ collectionConfig, globalConfig }) =>
      (collectionConfig && !collectionConfig?.admin?.hideAPIURL) ||
      (globalConfig && !globalConfig?.admin?.hideAPIURL),
    href: '/api',
    label: 'API',
    order: 1000,
  },
  default: {
    condition: ({ collectionConfig, config, globalConfig }) => {
      return !isLivePreviewEnabled({ collectionConfig, config, globalConfig })
    },
    href: '',
    // isActive: ({ href, location }) =>
    // location.pathname === href || location.pathname === `${href}/create`,
    label: ({ t }) => t('general:edit'),
    order: 0,
  },
  edit: {
    condition: ({ collectionConfig, config, globalConfig }) => {
      return isLivePreviewEnabled({ collectionConfig, config, globalConfig })
    },
    href: '/edit',
    label: ({ t }) => t('general:edit'),
    order: 200,
  },
  livePreview: {
    condition: ({ collectionConfig, config, globalConfig }) => {
      return !isLivePreviewEnabled({ collectionConfig, config, globalConfig })
    },
    href: '/preview',
    label: ({ t }) => t('general:livePreview'),
    order: 100,
  },
  livePreviewDefault: {
    condition: ({ collectionConfig, config, globalConfig }) => {
      return isLivePreviewEnabled({ collectionConfig, config, globalConfig })
    },
    href: '',
    label: ({ t }) => t('general:livePreview'),
    order: 0,
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
    order: 300,
    Pill_Component: VersionsPill,
  },
}
