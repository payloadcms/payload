/* eslint-disable no-console */
'use client'

import type { Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { Column } from '../../Table/index.js'
import type { PublishType, UpcomingEvent } from './types.js'

import { FieldLabel } from '../../../fields/FieldLabel/index.js'
import { Radio } from '../../../fields/RadioGroup/Radio/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import { Banner } from '../../Banner/index.js'
import { DrawerCloseButton } from '../../BulkUpload/DrawerCloseButton/index.js'
import { Button } from '../../Button/index.js'
import { DatePickerField } from '../../DatePicker/index.js'
import { Drawer } from '../../Drawer/index.js'
import { Gutter } from '../../Gutter/index.js'
import { ReactSelect } from '../../ReactSelect/index.js'
import { ShimmerEffect } from '../../ShimmerEffect/index.js'
import { Table } from '../../Table/index.js'
import { buildUpcomingColumns } from './buildUpcomingColumns.js'
import './index.scss'

const baseClass = 'schedule-publish'

type Props = {
  slug: string
}

const defaultLocaleOption = {
  label: 'All',
  value: 'all',
}

export const ScheduleDrawer: React.FC<Props> = ({ slug }) => {
  const { toggleModal } = useModal()
  const {
    config: {
      admin: { dateFormat },
      localization,
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { id, collectionSlug, globalSlug, title } = useDocumentInfo()
  const { i18n, t } = useTranslation()
  const { schedulePublish } = useServerFunctions()
  const [type, setType] = React.useState<PublishType>('publish')
  const [date, setDate] = React.useState<Date>()
  const [locale, setLocale] = React.useState<{ label: string; value: string }>(defaultLocaleOption)
  const [processing, setProcessing] = React.useState(false)
  const modalTitle = t('general:schedulePublishFor', { title })
  const [upcoming, setUpcoming] = React.useState<UpcomingEvent[]>()
  const [upcomingColumns, setUpcomingColumns] = React.useState<Column[]>()
  const deleteHandlerRef = React.useRef<((id: number | string) => Promise<void>) | null>(() => null)

  const localeOptions = React.useMemo(() => {
    if (localization) {
      const options = localization.locales.map(({ code, label }) => ({
        label: getTranslation(label, i18n),
        value: code,
      }))

      options.unshift(defaultLocaleOption)

      return options
    }

    return []
  }, [localization, i18n])

  const fetchUpcoming = React.useCallback(async () => {
    const query: { sort: string; where: Where } = {
      sort: 'waitUntil',
      where: {
        and: [
          {
            taskSlug: {
              equals: 'schedulePublish',
            },
          },
          {
            waitUntil: {
              greater_than: new Date(),
            },
          },
        ],
      },
    }

    if (collectionSlug) {
      query.where.and.push({
        'input.doc.value': {
          equals: String(id),
        },
      })
      query.where.and.push({
        'input.doc.relationTo': {
          equals: collectionSlug,
        },
      })
    }

    if (globalSlug) {
      query.where.and.push({
        'input.global': {
          equals: globalSlug,
        },
      })
    }

    const { docs } = await requests
      .post(`${serverURL}${api}/payload-jobs`, {
        body: qs.stringify(query),
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-HTTP-Method-Override': 'GET',
        },
      })
      .then((res) => res.json())

    setUpcomingColumns(
      buildUpcomingColumns({
        dateFormat,
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        deleteHandler: deleteHandlerRef.current,
        docs,
        i18n,
        localization,
        t,
      }),
    )
    setUpcoming(docs)
  }, [collectionSlug, globalSlug, serverURL, api, dateFormat, id, t, i18n, localization])

  const deleteHandler = React.useCallback(
    async (id: number | string) => {
      try {
        await schedulePublish({
          deleteID: id,
        })
        await fetchUpcoming()
        toast.success(t('general:deletedSuccessfully'))
      } catch (err) {
        console.error(err)
        toast.error(err.message)
      }
    },
    [fetchUpcoming, schedulePublish, t],
  )

  React.useEffect(() => {
    deleteHandlerRef.current = deleteHandler
  }, [deleteHandler])

  const handleSave = React.useCallback(async () => {
    if (!date) {
      return toast.error(t('general:noDateSelected'))
    }

    setProcessing(true)

    let publishSpecificLocale: string

    if (typeof locale === 'object' && locale.value !== 'all' && type === 'publish') {
      publishSpecificLocale = locale.value
    }

    try {
      await schedulePublish({
        type,
        date,
        doc: collectionSlug
          ? {
              relationTo: collectionSlug,
              value: String(id),
            }
          : undefined,
        global: globalSlug || undefined,
        locale: publishSpecificLocale,
      })

      setDate(undefined)
      toast.success(t('version:scheduledSuccessfully'))
      void fetchUpcoming()
    } catch (err) {
      console.error(err)
      toast.error(err.message)
    }

    setProcessing(false)
  }, [date, t, schedulePublish, type, locale, collectionSlug, id, globalSlug, fetchUpcoming])

  React.useEffect(() => {
    if (!upcoming) {
      const fetchInitialUpcoming = async () => {
        await fetchUpcoming()
      }

      void fetchInitialUpcoming()
    }
  }, [upcoming, fetchUpcoming])

  return (
    <Drawer
      className={baseClass}
      gutter={false}
      Header={
        <div className={`${baseClass}__drawer-header`}>
          <h2 title={modalTitle}>{modalTitle}</h2>
          <DrawerCloseButton onClick={() => toggleModal(slug)} />
        </div>
      }
      slug={slug}
    >
      <Gutter className={`${baseClass}__scheduler`}>
        <FieldLabel label={t('version:type')} required />
        <ul className={`${baseClass}__type`}>
          <li>
            <Radio
              id={`${slug}-type`}
              isSelected={type === 'publish'}
              onChange={() => setType('publish')}
              option={{ label: t('version:publish'), value: 'publish' }}
              path={`${slug}-type`}
              readOnly={processing}
            />
          </li>
          <li>
            <Radio
              id={`${slug}-type`}
              isSelected={type === 'unpublish'}
              onChange={() => setType('unpublish')}
              option={{ label: t('version:unpublish'), value: 'unpublish' }}
              path={`${slug}-type`}
              readOnly={processing}
            />
          </li>
        </ul>
        <br />
        <FieldLabel label={t('general:time')} required />
        <DatePickerField
          minDate={new Date()}
          onChange={(e) => setDate(e)}
          pickerAppearance="dayAndTime"
          readOnly={processing}
          timeIntervals={5}
          value={date}
        />
        <br />
        {localeOptions.length > 0 && type === 'publish' && (
          <React.Fragment>
            <FieldLabel label={t('localization:localeToPublish')} />
            <ReactSelect
              onChange={(e) => setLocale(e as { label: string; value: string })}
              options={localeOptions}
              value={locale}
            />
            <br />
          </React.Fragment>
        )}
        <div className={`${baseClass}__actions`}>
          <Button buttonStyle="primary" disabled={processing} onClick={handleSave} type="button">
            {t('general:save')}
          </Button>
          {processing ? <span>{t('general:saving')}</span> : null}
        </div>
      </Gutter>
      <Gutter className={`${baseClass}__upcoming`}>
        <h4>{t('general:upcomingEvents')}</h4>
        {!upcoming && <ShimmerEffect />}
        {upcoming?.length === 0 && (
          <Banner type="info">{t('general:noUpcomingEventsScheduled')}</Banner>
        )}
        {upcoming?.length > 0 && (
          <Table appearance="condensed" columns={upcomingColumns} data={upcoming} />
        )}
      </Gutter>
    </Drawer>
  )
}
