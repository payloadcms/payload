import type { I18n } from '@payloadcms/translations'
import type { Column } from '@payloadcms/ui'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { SortColumn } from '@payloadcms/ui'
import React from 'react'

import { AutosaveCell } from './cells/AutosaveCell'
import { CreatedAtCell } from './cells/CreatedAt'
import { IDCell } from './cells/ID'

export const buildVersionColumns = ({
  collectionConfig,
  config,
  docID,
  globalConfig,
  i18n: { t },
  i18n,
}: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  docID?: number | string
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
}): Column[] => [
  {
    name: '',
    accessor: 'updatedAt',
    active: true,
    components: {
      Cell: (
        <CreatedAtCell
          collectionSlug={collectionConfig?.slug}
          docID={docID}
          globalSlug={globalConfig?.slug}
        />
      ),
      Heading: <SortColumn label={t('general:updatedAt')} name="updatedAt" />,
    },
    label: '',
  },
  {
    name: '',
    accessor: 'id',
    active: true,
    components: {
      Cell: <IDCell />,
      Heading: <SortColumn disable label={t('version:versionID')} name="id" />,
    },
    label: '',
  },
  {
    name: '',
    accessor: 'autosave',
    active: true,
    components: {
      Cell: <AutosaveCell />,
      Heading: <SortColumn disable label={t('version:type')} name="autosave" />,
    },
    label: '',
  },
]
