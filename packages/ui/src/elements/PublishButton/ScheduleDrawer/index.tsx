/* eslint-disable no-console */
'use client'

import type { Column, SchedulePublish, Where } from 'payload'

import { TZDateMini as TZDate } from '@date-fns/tz/date/mini'
import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { transpose } from 'date-fns/transpose'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

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
import './index.scss'
import { Table } from '../../Table/index.js'
import { TimezonePicker } from '../../TimezonePicker/index.js'
import { buildUpcomingColumns } from './buildUpcomingColumns.js'

const baseClass = 'schedule-publish'

type Props = {
  defaultType?: PublishType
  schedulePublishConfig?: SchedulePublish
  slug: string
}

const defaultLocaleOption = {
  label: 'All',
  value: 'all',
}

export const ScheduleDrawer: React.FC<Props> = ({ slug, defaultType, schedulePublishConfig }) => {
  const { toggleModal } = useModal()
  const {
    config: {
      admin: {
        dateFormat,
        timezones: { defaultTimezone, supportedTimezones },
      },
      localization,
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { id, collectionSlug, globalSlug, title } = useDocumentInfo()
  const { i18n, t } = useTranslation()
  const { schedulePublish } = useServerFunctions()
  const [type, setType] = React.useState<PublishType>(defaultType || 'publish')
  const [date, setDate] = React.useState<Date>()
  const [timezone, setTimezone] = React.useState<string>(defaultTimezone)
  const [locale, setLocale] = React.useState<{ label: string; value: string }>(defaultLocaleOption)
  const [processing, setProcessing] = React.useState(false)
  const modalTitle = t('general:schedulePublishFor', { title })
  const [upcoming, setUpcoming] = React.useState<UpcomingEvent[]>()
  const [upcomingColumns, setUpcomingColumns] = React.useState<Column[]>()
  const deleteHandlerRef = React.useRef<((id: number | string) => Promise<void>) | null>(() => null)

  // Get the user timezone so we can adjust the displayed value against it
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

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
        supportedTimezones,
        t,
      }),
    )
    setUpcoming(docs)
  }, [
    collectionSlug,
    globalSlug,
    serverURL,
    api,
    i18n,
    dateFormat,
    localization,
    supportedTimezones,
    t,
    id,
  ])

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
        timezone,
      })

      setDate(undefined)
      toast.success(t('version:scheduledSuccessfully'))
      void fetchUpcoming()
    } catch (err) {
      console.error(err)
      toast.error(err.message)
    }

    setProcessing(false)
  }, [
    date,
    locale,
    type,
    t,
    schedulePublish,
    collectionSlug,
    id,
    globalSlug,
    timezone,
    fetchUpcoming,
  ])

  const displayedValue = useMemo(() => {
    if (timezone && userTimezone && date) {
      // Create TZDate instances for the selected timezone and the user's timezone
      // These instances allow us to transpose the date between timezones while keeping the same time value
      const DateWithOriginalTz = TZDate.tz(timezone)
      const DateWithUserTz = TZDate.tz(userTimezone)

      const modifiedDate = new TZDate(date).withTimeZone(timezone)

      // Transpose the date to the selected timezone
      const dateWithTimezone = transpose(modifiedDate, DateWithOriginalTz)

      // Transpose the date to the user's timezone - this is necessary because the react-datepicker component insists on displaying the date in the user's timezone
      const dateWithUserTimezone = transpose(dateWithTimezone, DateWithUserTz)

      return dateWithUserTimezone.toISOString()
    }

    return date
  }, [timezone, date, userTimezone])

  const onChangeDate = useCallback(
    (incomingDate: Date) => {
      if (timezone && incomingDate) {
        // Create TZDate instances for the selected timezone
        const tzDateWithUTC = TZDate.tz(timezone)

        // Creates a TZDate instance for the user's timezone  — this is default behaviour of TZDate as it wraps the Date constructor
        const dateToUserTz = new TZDate(incomingDate)

        // Transpose the date to the selected timezone
        const dateWithTimezone = transpose(dateToUserTz, tzDateWithUTC)

        setDate(dateWithTimezone || null)
      } else {
        setDate(incomingDate || null)
      }
    },
    [setDate, timezone],
  )

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
        <FieldLabel label={t('general:time')} path={'time'} required />
        <DatePickerField
          id="time"
          minDate={new Date()}
          onChange={(e) => onChangeDate(e)}
          pickerAppearance="dayAndTime"
          readOnly={processing}
          timeFormat={schedulePublishConfig?.timeFormat}
          timeIntervals={schedulePublishConfig?.timeIntervals ?? 5}
          value={displayedValue}
        />
        {supportedTimezones.length > 0 && (
          <TimezonePicker
            id={`timezone-picker`}
            onChange={setTimezone}
            options={supportedTimezones}
            selectedTimezone={timezone}
          />
        )}
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
          <Button
            buttonStyle="primary"
            disabled={processing}
            id="scheduled-publish-save"
            onClick={handleSave}
            type="button"
          >
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
