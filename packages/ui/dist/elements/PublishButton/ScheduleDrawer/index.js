/* eslint-disable no-console */'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TZDateMini as TZDate } from '@date-fns/tz/date/mini';
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { endOfToday, isToday, startOfDay } from 'date-fns';
import { transpose } from 'date-fns/transpose';
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import React, { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { FieldLabel } from '../../../fields/FieldLabel/index.js';
import { Radio } from '../../../fields/RadioGroup/Radio/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js';
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js';
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { requests } from '../../../utilities/api.js';
import { Banner } from '../../Banner/index.js';
import { DrawerCloseButton } from '../../BulkUpload/DrawerCloseButton/index.js';
import { Button } from '../../Button/index.js';
import { DatePickerField } from '../../DatePicker/index.js';
import { Drawer } from '../../Drawer/index.js';
import { Gutter } from '../../Gutter/index.js';
import './index.scss';
import { ReactSelect } from '../../ReactSelect/index.js';
import { ShimmerEffect } from '../../ShimmerEffect/index.js';
import { Table } from '../../Table/index.js';
import { TimezonePicker } from '../../TimezonePicker/index.js';
import { buildUpcomingColumns } from './buildUpcomingColumns.js';
const baseClass = 'schedule-publish';
const defaultLocaleOption = {
  label: 'All',
  value: 'all'
};
export const ScheduleDrawer = ({
  slug,
  defaultType,
  schedulePublishConfig
}) => {
  const {
    toggleModal
  } = useModal();
  const {
    config: {
      admin: {
        dateFormat,
        timezones: {
          defaultTimezone,
          supportedTimezones
        }
      },
      localization,
      routes: {
        api
      },
      serverURL
    }
  } = useConfig();
  const {
    id,
    collectionSlug,
    globalSlug
  } = useDocumentInfo();
  const {
    title
  } = useDocumentTitle();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    schedulePublish
  } = useServerFunctions();
  const [type, setType] = React.useState(defaultType || 'publish');
  const [date, setDate] = React.useState();
  const [timezone, setTimezone] = React.useState(defaultTimezone);
  const [locale, setLocale] = React.useState(defaultLocaleOption);
  const [processing, setProcessing] = React.useState(false);
  const modalTitle = t('general:schedulePublishFor', {
    title
  });
  const [upcoming, setUpcoming] = React.useState();
  const [upcomingColumns, setUpcomingColumns] = React.useState();
  const deleteHandlerRef = React.useRef(() => null);
  // Get the user timezone so we can adjust the displayed value against it
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localeOptions = React.useMemo(() => {
    if (localization) {
      const options = localization.locales.map(({
        code,
        label
      }) => ({
        label: getTranslation(label, i18n),
        value: code
      }));
      options.unshift(defaultLocaleOption);
      return options;
    }
    return [];
  }, [localization, i18n]);
  const fetchUpcoming = React.useCallback(async () => {
    const query = {
      sort: 'waitUntil',
      where: {
        and: [{
          taskSlug: {
            equals: 'schedulePublish'
          }
        }, {
          waitUntil: {
            greater_than: new Date()
          }
        }]
      }
    };
    if (collectionSlug) {
      query.where.and.push({
        'input.doc.value': {
          equals: String(id)
        }
      });
      query.where.and.push({
        'input.doc.relationTo': {
          equals: collectionSlug
        }
      });
    }
    if (globalSlug) {
      query.where.and.push({
        'input.global': {
          equals: globalSlug
        }
      });
    }
    const {
      docs
    } = await requests.post(formatAdminURL({
      apiRoute: api,
      path: `/payload-jobs`
    }), {
      body: qs.stringify(query),
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Payload-HTTP-Method-Override': 'GET'
      }
    }).then(res => res.json());
    setUpcomingColumns(buildUpcomingColumns({
      dateFormat,
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      deleteHandler: deleteHandlerRef.current,
      docs,
      i18n,
      localization,
      supportedTimezones,
      t
    }));
    setUpcoming(docs);
  }, [collectionSlug, globalSlug, serverURL, api, i18n, dateFormat, localization, supportedTimezones, t, id]);
  const deleteHandler = React.useCallback(async id_0 => {
    try {
      await schedulePublish({
        deleteID: id_0
      });
      await fetchUpcoming();
      toast.success(t('general:deletedSuccessfully'));
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  }, [fetchUpcoming, schedulePublish, t]);
  React.useEffect(() => {
    deleteHandlerRef.current = deleteHandler;
  }, [deleteHandler]);
  const handleSave = React.useCallback(async () => {
    if (!date) {
      return toast.error(t('general:noDateSelected'));
    }
    setProcessing(true);
    let publishSpecificLocale;
    if (typeof locale === 'object' && locale.value !== 'all' && type === 'publish') {
      publishSpecificLocale = locale.value;
    }
    try {
      await schedulePublish({
        type,
        date,
        doc: collectionSlug ? {
          relationTo: collectionSlug,
          value: String(id)
        } : undefined,
        global: globalSlug || undefined,
        locale: publishSpecificLocale,
        timezone
      });
      setDate(undefined);
      toast.success(t('version:scheduledSuccessfully'));
      void fetchUpcoming();
    } catch (err_0) {
      console.error(err_0);
      toast.error(err_0.message);
    }
    setProcessing(false);
  }, [date, locale, type, t, schedulePublish, collectionSlug, id, globalSlug, timezone, fetchUpcoming]);
  const displayedValue = useMemo(() => {
    if (timezone && userTimezone && date) {
      // Create TZDate instances for the selected timezone and the user's timezone
      // These instances allow us to transpose the date between timezones while keeping the same time value
      const DateWithOriginalTz = TZDate.tz(timezone);
      const DateWithUserTz = TZDate.tz(userTimezone);
      const modifiedDate = new TZDate(date).withTimeZone(timezone);
      // Transpose the date to the selected timezone
      const dateWithTimezone = transpose(modifiedDate, DateWithOriginalTz);
      // Transpose the date to the user's timezone - this is necessary because the react-datepicker component insists on displaying the date in the user's timezone
      const dateWithUserTimezone = transpose(dateWithTimezone, DateWithUserTz);
      return dateWithUserTimezone.toISOString();
    }
    return date;
  }, [timezone, date, userTimezone]);
  const onChangeDate = useCallback(incomingDate => {
    if (timezone && incomingDate) {
      // Create TZDate instances for the selected timezone
      const tzDateWithUTC = TZDate.tz(timezone);
      // Creates a TZDate instance for the user's timezone  — this is default behaviour of TZDate as it wraps the Date constructor
      const dateToUserTz = new TZDate(incomingDate);
      // Transpose the date to the selected timezone
      const dateWithTimezone_0 = transpose(dateToUserTz, tzDateWithUTC);
      setDate(dateWithTimezone_0 || null);
    } else {
      setDate(incomingDate || null);
    }
  }, [setDate, timezone]);
  React.useEffect(() => {
    if (!upcoming) {
      const fetchInitialUpcoming = async () => {
        await fetchUpcoming();
      };
      void fetchInitialUpcoming();
    }
  }, [upcoming, fetchUpcoming]);
  const minTime = useMemo(() => {
    if (date && isToday(date)) {
      return new Date();
    }
    return startOfDay(new Date());
  }, [date]);
  return /*#__PURE__*/_jsxs(Drawer, {
    className: baseClass,
    gutter: false,
    Header: /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__drawer-header`,
      children: [/*#__PURE__*/_jsx("h2", {
        title: modalTitle,
        children: modalTitle
      }), /*#__PURE__*/_jsx(DrawerCloseButton, {
        onClick: () => toggleModal(slug)
      })]
    }),
    slug: slug,
    children: [/*#__PURE__*/_jsxs(Gutter, {
      className: `${baseClass}__scheduler`,
      children: [/*#__PURE__*/_jsx(FieldLabel, {
        label: t('version:type'),
        required: true
      }), /*#__PURE__*/_jsxs("ul", {
        className: `${baseClass}__type`,
        children: [/*#__PURE__*/_jsx("li", {
          children: /*#__PURE__*/_jsx(Radio, {
            id: `${slug}-type`,
            isSelected: type === 'publish',
            onChange: () => setType('publish'),
            option: {
              label: t('version:publish'),
              value: 'publish'
            },
            path: `${slug}-type`,
            readOnly: processing
          })
        }), /*#__PURE__*/_jsx("li", {
          children: /*#__PURE__*/_jsx(Radio, {
            id: `${slug}-type`,
            isSelected: type === 'unpublish',
            onChange: () => setType('unpublish'),
            option: {
              label: t('version:unpublish'),
              value: 'unpublish'
            },
            path: `${slug}-type`,
            readOnly: processing
          })
        })]
      }), /*#__PURE__*/_jsx("br", {}), /*#__PURE__*/_jsx(FieldLabel, {
        label: t('general:time'),
        path: 'time',
        required: true
      }), /*#__PURE__*/_jsx(DatePickerField, {
        id: "time",
        maxTime: endOfToday(),
        minDate: new Date(),
        minTime: minTime,
        onChange: e => onChangeDate(e),
        pickerAppearance: "dayAndTime",
        readOnly: processing,
        timeFormat: schedulePublishConfig?.timeFormat,
        timeIntervals: schedulePublishConfig?.timeIntervals ?? 5,
        value: displayedValue
      }), supportedTimezones.length > 0 && /*#__PURE__*/_jsx(TimezonePicker, {
        id: `timezone-picker`,
        onChange: setTimezone,
        options: supportedTimezones,
        selectedTimezone: timezone
      }), /*#__PURE__*/_jsx("br", {}), localeOptions.length > 0 && type === 'publish' && /*#__PURE__*/_jsxs(React.Fragment, {
        children: [/*#__PURE__*/_jsx(FieldLabel, {
          label: t('localization:localeToPublish')
        }), /*#__PURE__*/_jsx(ReactSelect, {
          onChange: e_0 => setLocale(e_0),
          options: localeOptions,
          value: locale
        }), /*#__PURE__*/_jsx("br", {})]
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__actions`,
        children: [/*#__PURE__*/_jsx(Button, {
          buttonStyle: "primary",
          disabled: processing,
          id: "scheduled-publish-save",
          onClick: handleSave,
          type: "button",
          children: t('general:save')
        }), processing ? /*#__PURE__*/_jsx("span", {
          children: t('general:saving')
        }) : null]
      })]
    }), /*#__PURE__*/_jsxs(Gutter, {
      className: `${baseClass}__upcoming`,
      children: [/*#__PURE__*/_jsx("h4", {
        children: t('general:upcomingEvents')
      }), !upcoming && /*#__PURE__*/_jsx(ShimmerEffect, {}), upcoming?.length === 0 && /*#__PURE__*/_jsx(Banner, {
        type: "info",
        children: t('general:noUpcomingEventsScheduled')
      }), upcoming?.length > 0 && /*#__PURE__*/_jsx(Table, {
        appearance: "condensed",
        columns: upcomingColumns,
        data: upcoming
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map