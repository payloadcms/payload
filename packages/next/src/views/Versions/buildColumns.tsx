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
      Label: '',
      accessor: 'updatedAt',
      active: true,
      cellProps: {
        field: {
          name: '',
          type: 'date',
        },
      },
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
        Heading: <SortColumn Label={t('general:updatedAt')} name="updatedAt" />,
      },
    },
    {
      Label: '',
      accessor: 'id',
      active: true,
      cellProps: {
        field: {
          name: '',
          type: 'text',
        },
      },
      components: {
        Cell: {
          type: 'client',
          Component: null,
          RenderedComponent: <IDCell />,
        },
        Heading: <SortColumn Label={t('version:versionID')} disable name="id" />,
      },
    },
  ]

  if (
    entityConfig?.versions?.drafts ||
    (entityConfig?.versions?.drafts && entityConfig.versions.drafts?.autosave)
  ) {
    columns.push({
      Label: '',
      accessor: '_status',
      active: true,
      cellProps: {
        field: {
          name: '',
          type: 'checkbox',
        },
      },
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

        Heading: <SortColumn Label={t('version:status')} disable name="status" />,
      },
    })
  }

  return columns
}
