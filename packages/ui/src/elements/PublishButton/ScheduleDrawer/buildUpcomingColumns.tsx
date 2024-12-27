import type { I18nClient, TFunction } from '@payloadcms/translations'

import type { Column } from '../../Table/index.js'
import type { UpcomingEvent } from './types.js'

import { formatDate } from '../../../utilities/formatDate.js'
import { Pill } from '../../Pill/index.js'

type Args = {
  dateFormat: string
  docs: UpcomingEvent[]
  i18n: I18nClient
  t: TFunction
}

export const buildUpcomingColumns = ({ dateFormat, docs, i18n, t }: Args): Column[] => {
  return [
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
}
