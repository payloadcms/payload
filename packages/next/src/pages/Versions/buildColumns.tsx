import React from 'react'

import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import type { Column } from '@payloadcms/ui'
import { SortColumn } from '@payloadcms/ui'
import { I18n } from '@payloadcms/translations'
import { CreatedAtCell } from './cells/CreatedAt'
import { IDCell } from './cells/ID'
import { AutosaveCell } from './cells/AutosaveCell'

export const buildVersionColumns = ({
  config,
  collectionConfig,
  globalConfig,
  docID,
  i18n: { t },
  i18n,
}: {
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  docID?: string | number
  i18n: I18n
}): Column[] => [
  {
    name: '',
    accessor: 'updatedAt',
    active: true,
    components: {
      Heading: <SortColumn label={t('general:updatedAt')} name="updatedAt" />,
      Cell: (
        <CreatedAtCell
          docID={docID}
          collectionSlug={collectionConfig?.slug}
          globalSlug={globalConfig?.slug}
        />
      ),
    },
    label: '',
  },
  {
    name: '',
    accessor: 'id',
    active: true,
    components: {
      Heading: <SortColumn disable label={t('version:versionID')} name="id" />,
      Cell: <IDCell />,
    },
    label: '',
  },
  {
    name: '',
    accessor: 'autosave',
    active: true,
    components: {
      Heading: <SortColumn disable label={t('version:type')} name="autosave" />,
      Cell: <AutosaveCell />,
    },
    label: '',
  },
]
