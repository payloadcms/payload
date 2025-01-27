import type { TFunction } from 'react-i18next'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useRouteMatch } from 'react-router-dom'

import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'
import type { Column } from '../../elements/Table/types'

import { formatDate } from '../../../utilities/formatDate'
import SortColumn from '../../elements/SortColumn'
import { useConfig } from '../../utilities/Config'
import { AutosaveCell } from './cells/AutosaveCell'

type CreatedAtCellProps = {
  collection?: SanitizedCollectionConfig
  date: string
  global?: SanitizedGlobalConfig
  id: string
}

const CreatedAtCell: React.FC<CreatedAtCellProps> = ({ id, collection, date, global }) => {
  const {
    admin: { dateFormat },
    routes: { admin },
  } = useConfig()
  const {
    params: { id: docID },
  } = useRouteMatch<{ id: string }>()

  const { i18n } = useTranslation()

  let to: string

  if (collection) to = `${admin}/collections/${collection.slug}/${docID}/versions/${id}`
  if (global) to = `${admin}/globals/${global.slug}/versions/${id}`

  return <Link to={to}>{date && formatDate(date, dateFormat, i18n?.language)}</Link>
}

const TextCell: React.FC<{ children?: React.ReactNode }> = ({ children }) => <span>{children}</span>

export const buildVersionColumns = (
  collection: SanitizedCollectionConfig,
  global: SanitizedGlobalConfig,
  t: TFunction,
  latestDraftVersion?: string,
  latestPublishedVersion?: string,
): Column[] => {
  const entityConfig = collection || global

  const columns: Column[] = [
    {
      name: '',
      accessor: 'updatedAt',
      active: true,
      components: {
        Heading: <SortColumn label={t('general:updatedAt')} name="updatedAt" />,
        renderCell: (row, data) => (
          <CreatedAtCell collection={collection} date={data} global={global} id={row?.id} />
        ),
      },
      label: '',
    },
    {
      name: '',
      accessor: 'id',
      active: true,
      components: {
        Heading: <SortColumn disable label={t('versionID')} name="id" />,
        renderCell: (row, data) => <TextCell>{data}</TextCell>,
      },
      label: '',
    },
  ]

  if (
    entityConfig?.versions?.drafts ||
    (entityConfig?.versions?.drafts && entityConfig.versions.drafts?.autosave)
  ) {
    columns.push({
      name: '',
      accessor: 'autosave',
      active: true,
      components: {
        Heading: <SortColumn disable label={t('status')} name="autosave" />,
        renderCell: (row) => {
          return (
            <AutosaveCell
              latestDraftVersion={latestDraftVersion}
              latestPublishedVersion={latestPublishedVersion}
              rowData={row}
            />
          )
        },
      },
      label: '',
    })
  }

  return columns
}
