// import type { TFunction } from 'react-i18next'

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

type CreatedAtCellProps = {
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  date: string
  versionID: string
  docID: string
}

const CreatedAtCell: React.FC<CreatedAtCellProps> = ({
  versionID,
  docID,
  config,
  collectionConfig,
  // date,
  globalConfig,
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
      {/* {date && formatDate(date, dateFormat, i18n?.language)} */}
    </Link>
  )
}

const TextCell: React.FC<{ children?: React.ReactNode }> = ({ children }) => <span>{children}</span>

export const buildVersionColumns = (
  config: SanitizedConfig,
  collectionConfig: SanitizedCollectionConfig,
  globalConfig: SanitizedGlobalConfig,
  // t: TFunction,
): Column[] => [
  {
    name: '',
    accessor: 'updatedAt',
    active: true,
    components: {
      Heading: (
        <SortColumn
          label="Updated At"
          //  label={t('general:updatedAt')}
          name="updatedAt"
        />
      ),
      renderCell: (row, data) => (
        <CreatedAtCell
          config={config}
          collectionConfig={collectionConfig}
          date={data}
          globalConfig={globalConfig}
          versionID={row?.id}
          docID={row?.document}
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
      Heading: (
        <SortColumn
          disable
          label="ID"
          //  label={t('versionID')}
          name="id"
        />
      ),
      renderCell: (row, data) => <TextCell>{data}</TextCell>,
    },
    label: '',
  },
  {
    name: '',
    accessor: 'autosave',
    active: true,
    components: {
      Heading: (
        <SortColumn
          disable
          label="Type"
          // label={t('type')}
          name="autosave"
        />
      ),
      renderCell: (row) => (
        <TextCell>
          {row?.autosave && (
            <React.Fragment>
              <Pill>
                Autosave
                {/* {t('autosave')} */}
              </Pill>
              &nbsp;&nbsp;
            </React.Fragment>
          )}
          {row?.version._status === 'published' && (
            <React.Fragment>
              <Pill pillStyle="success">
                Published
                {/* {t('published')} */}
              </Pill>
              &nbsp;&nbsp;
            </React.Fragment>
          )}
          {row?.version._status === 'draft' && (
            <Pill>
              Draft
              {/* {t('draft')} */}
            </Pill>
          )}
        </TextCell>
      ),
    },
    label: '',
  },
]
