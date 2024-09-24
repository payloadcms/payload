import type { I18n } from '@payloadcms/translations'
import type { SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload'

import { type Column, SortColumn } from '@payloadcms/ui'
import React from 'react'

import { AutosaveCell } from './cells/AutosaveCell/index.js'
import { CreatedAtCell } from './cells/CreatedAt/index.js'
import { IDCell } from './cells/ID/index.js'

export const buildVersionColumns = ({
  collectionConfig,
  docID,
  globalConfig,
  i18n: { t },
  latestDraftVersion,
  latestPublishedVersion,
}: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  docID?: number | string
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  latestDraftVersion?: string
  latestPublishedVersion?: string
}): Column[] => {
  const entityConfig = collectionConfig || globalConfig

  const columns: Column[] = [
    {
      accessor: 'updatedAt',
      active: true,
      cellProps: {
        field: {
          name: '',
          type: 'date',
          admin: {
            components: {
              Cell: {
                type: 'client',
                Component: null,
                RenderedComponent: (
                  <CreatedAtCell
                    collectionSlug={collectionConfig?.slug}
                    docID={docID}
                    globalSlug={globalConfig?.slug}
                  />
                ),
              },
              Label: {
                type: 'client',
                Component: null,
              },
            },
          },
        },
      },
      Heading: <SortColumn Label={t('general:updatedAt')} name="updatedAt" />,
    },
    {
      accessor: 'id',
      active: true,
      cellProps: {
        field: {
          name: '',
          type: 'text',
          admin: {
            components: {
              Cell: {
                type: 'client',
                Component: null,
                RenderedComponent: <IDCell />,
              },
              Label: {
                type: 'client',
                Component: null,
              },
            },
          },
        },
      },
      Heading: <SortColumn disable Label={t('version:versionID')} name="id" />,
    },
  ]

  if (
    entityConfig?.versions?.drafts ||
    (entityConfig?.versions?.drafts && entityConfig.versions.drafts?.autosave)
  ) {
    columns.push({
      accessor: '_status',
      active: true,
      cellProps: {
        field: {
          name: '',
          type: 'checkbox',
          admin: {
            components: {
              Cell: {
                type: 'client',
                Component: null,
                RenderedComponent: (
                  <AutosaveCell
                    latestDraftVersion={latestDraftVersion}
                    latestPublishedVersion={latestPublishedVersion}
                  />
                ),
              },
              Label: {
                type: 'client',
                Component: null,
              },
            },
          },
        },
      },
      Heading: <SortColumn disable Label={t('version:status')} name="status" />,
    })
  }

  return columns
}
