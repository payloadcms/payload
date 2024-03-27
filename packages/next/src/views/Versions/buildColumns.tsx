import type { I18n } from '@payloadcms/translations'
import type { Column } from '@payloadcms/ui/elements/Table'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { SortColumn } from '@payloadcms/ui/elements/SortColumn'
import React from 'react'

import { AutosaveCell } from './cells/AutosaveCell/index.js'
import { CreatedAtCell } from './cells/CreatedAt/index.js'
import { IDCell } from './cells/ID/index.js'

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
    Label: '',
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
      Heading: <SortColumn Label={t('general:updatedAt')} name="updatedAt" />,
    },
  },
  {
    name: '',
    Label: '',
    accessor: 'id',
    active: true,
    components: {
      Cell: <IDCell />,
      Heading: <SortColumn Label={t('version:versionID')} disable name="id" />,
    },
  },
  {
    name: '',
    Label: '',
    accessor: 'autosave',
    active: true,
    components: {
      Cell: <AutosaveCell />,
      Heading: <SortColumn Label={t('version:type')} disable name="autosave" />,
    },
  },
]
