import React from 'react'

import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import type { Column } from '@payloadcms/ui'
import {
  Pill,
  // formatDate,
  SortColumn,
} from '@payloadcms/ui'
import Link from 'next/link'
import { I18n } from '@payloadcms/translations'

type CreatedAtCellProps = {
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  date: string
  versionID: string
  docID: string
  i18n: I18n
}

const CreatedAtCell: React.FC<CreatedAtCellProps> = ({
  versionID,
  docID,
  config,
  collectionConfig,
  // date,
  globalConfig,
  i18n,
}) => {
  const {
    routes: { admin },
    // admin: { dateFormat },
  } = config

  let to: string

  if (collectionConfig)
    to = `${admin}/collections/${collectionConfig.slug}/${docID}/versions/${versionID}`
  if (globalConfig) to = `${admin}/globals/${globalConfig.slug}/versions/${versionID}`

  return (
    <Link href={to}>
      Date here
      {/* TODO(i18n) */}
      {/* {date && formatDate(date, dateFormat, i18n?.language)} */}
    </Link>
  )
}

const TextCell: React.FC<{ children?: React.ReactNode }> = ({ children }) => <span>{children}</span>

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
  docID?: string
  i18n: I18n
}): Column[] => [
  {
    name: '',
    accessor: 'updatedAt',
    active: true,
    components: {
      Heading: <SortColumn label={t('general:updatedAt')} name="updatedAt" />,
      renderCell: (row, data) => (
        <CreatedAtCell
          config={config}
          collectionConfig={collectionConfig}
          date={data}
          globalConfig={globalConfig}
          versionID={row?.id}
          docID={docID}
          i18n={i18n}
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
      renderCell: (row, data) => <TextCell>{data}</TextCell>,
    },
    label: '',
  },
  {
    name: '',
    accessor: 'autosave',
    active: true,
    components: {
      Heading: <SortColumn disable label={t('version:type')} name="autosave" />,
      renderCell: (row) => (
        <TextCell>
          {row?.autosave && (
            <React.Fragment>
              <Pill>
                Autosave
                {t('version:autosave')}
              </Pill>
              &nbsp;&nbsp;
            </React.Fragment>
          )}
          {row?.version._status === 'published' && (
            <React.Fragment>
              <Pill pillStyle="success">{t('version:published')}</Pill>
              &nbsp;&nbsp;
            </React.Fragment>
          )}
          {row?.version._status === 'draft' && <Pill>{t('version:draft')}</Pill>}
        </TextCell>
      ),
    },
    label: '',
  },
]
