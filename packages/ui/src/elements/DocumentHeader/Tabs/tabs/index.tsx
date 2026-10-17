import type { DocumentTabConfig, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import { branchesCollectionSlug } from 'payload/shared'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { BranchChangesPill, VersionsPill } from '../../../../exports/client/index.js'
import { BranchSettingsTab } from './BranchSettingsTab/index.js'

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

  // A branch gets its own two: what it changed, and its own fields behind a gear.
  // No API tab and no versions — a branch record is bookkeeping, and its history
  // is noise (the collection sets `versions: false`).
  if (collectionConfig?.slug === branchesCollectionSlug) {
    return [
      {
        // `Pill_Component` is read by `DefaultDocumentTab` but absent from
        // `DocumentTabConfig`; the versions tab relies on the same thing, and only
        // gets away with it because `.concat` below erases the excess-property check.
        tab: {
          href: '',
          label: ({ t }) => t('branching:changedDocuments'),
          order: 100,
          Pill_Component: BranchChangesPill,
        } as DocumentTabConfig,
        viewPath: '/',
      },
      {
        tab: {
          // Typed as a component *path* because config-supplied tabs are resolved
          // through the import map. `RenderServerComponent` takes a real component
          // just as happily, which is what keeps this out of the import map.
          Component: BranchSettingsTab as unknown as DocumentTabConfig['Component'],
          href: '/manage',
          order: 200,
        },
        viewPath: '/manage',
      },
    ]
  }

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
