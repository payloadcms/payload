import type { ClientConfig } from 'payload'

import { getTranslation, type I18nClient, type TFunction } from '@payloadcms/translations'

import type { Column } from '../../Table/index.js'
import type { UpcomingEvent } from './types.js'

import { formatDate } from '../../../utilities/formatDate.js'
import { Pill } from '../../Pill/index.js'

type Args = {
  dateFormat: string
  docs: UpcomingEvent[]
  i18n: I18nClient
  localization: ClientConfig['localization']
  t: TFunction
}

export const buildUpcomingColumns = ({
  dateFormat,
  docs,
  i18n,
  localization,
  t,
}: Args): Column[] => {
  const columns: Column[] = [
    {
      accessor: 'input.type',
      active: true,
      field: {
        name: '',
        type: 'text',
      },
      Heading: <span>{t('version:type')}</span>,
      renderedCells: docs.map((doc) => {
        const type = doc.input?.type

        return (
          <Pill key={doc.id} pillStyle={type === 'publish' ? 'success' : 'warning'}>
            {type === 'publish' && t('version:publish')}
            {type === 'unpublish' && t('version:unpublish')}
          </Pill>
        )
      }),
    },
    {
      accessor: 'waitUntil',
      active: true,
      field: {
        name: '',
        type: 'date',
      },
      Heading: <span>{t('general:time')}</span>,
      renderedCells: docs.map((doc) => (
        <span key={doc.id}>{formatDate({ date: doc.waitUntil, i18n, pattern: dateFormat })}</span>
      )),
    },
  ]

  if (localization) {
    columns.push({
      accessor: 'input.locale',
      active: true,
      field: {
        name: '',
        type: 'text',
      },
      Heading: <span>{t('general:locale')}</span>,
      renderedCells: docs.map((doc) => {
        if (doc.input.locale) {
          const matchedLocale = localization.locales.find(
            (locale) => locale.code === doc.input.locale,
          )
          if (matchedLocale) {
            return <span key={doc.id}>{getTranslation(matchedLocale.label, i18n)}</span>
          }
        }

        return <span key={doc.id}>{t('general:all')}</span>
      }),
    })
  }

  return columns
}
