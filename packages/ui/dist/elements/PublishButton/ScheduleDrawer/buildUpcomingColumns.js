import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { formatDate } from '../../../utilities/formatDocTitle/formatDateTitle.js';
import { Button } from '../../Button/index.js';
import { Pill } from '../../Pill/index.js';
export const buildUpcomingColumns = ({
  dateFormat,
  deleteHandler,
  docs,
  i18n,
  localization,
  supportedTimezones,
  t
}) => {
  const columns = [{
    accessor: 'input.type',
    active: true,
    field: {
      name: '',
      type: 'text'
    },
    Heading: /*#__PURE__*/_jsx("span", {
      children: t('version:type')
    }),
    renderedCells: docs.map(doc => {
      const type = doc.input?.type;
      return /*#__PURE__*/_jsxs(Pill, {
        pillStyle: type === 'publish' ? 'success' : 'warning',
        size: "small",
        children: [type === 'publish' && t('version:publish'), type === 'unpublish' && t('version:unpublish')]
      }, doc.id);
    })
  }, {
    accessor: 'waitUntil',
    active: true,
    field: {
      name: '',
      type: 'date'
    },
    Heading: /*#__PURE__*/_jsx("span", {
      children: t('general:time')
    }),
    renderedCells: docs.map(doc => /*#__PURE__*/_jsx("span", {
      children: formatDate({
        date: doc.waitUntil,
        i18n,
        pattern: dateFormat,
        timezone: doc.input.timezone
      })
    }, doc.id))
  }, {
    accessor: 'input.timezone',
    active: true,
    field: {
      name: '',
      type: 'text'
    },
    Heading: /*#__PURE__*/_jsx("span", {
      children: t('general:timezone')
    }),
    renderedCells: docs.map(doc => {
      const matchedTimezone = supportedTimezones.find(timezone => timezone.value === doc.input.timezone);
      const timezone = matchedTimezone?.label || doc.input.timezone;
      return /*#__PURE__*/_jsx("span", {
        children: timezone || t('general:noValue')
      }, doc.id);
    })
  }];
  if (localization) {
    columns.push({
      accessor: 'input.locale',
      active: true,
      field: {
        name: '',
        type: 'text'
      },
      Heading: /*#__PURE__*/_jsx("span", {
        children: t('general:locale')
      }),
      renderedCells: docs.map(doc => {
        if (doc.input.locale) {
          const matchedLocale = localization.locales.find(locale => locale.code === doc.input.locale);
          if (matchedLocale) {
            return /*#__PURE__*/_jsx("span", {
              children: getTranslation(matchedLocale.label, i18n)
            }, doc.id);
          }
        }
        return /*#__PURE__*/_jsx("span", {
          children: t('general:all')
        }, doc.id);
      })
    });
  }
  columns.push({
    accessor: 'delete',
    active: true,
    field: {
      name: 'delete',
      type: 'text'
    },
    Heading: /*#__PURE__*/_jsx("span", {
      children: t('general:delete')
    }),
    renderedCells: docs.map(doc => /*#__PURE__*/_jsx(Button, {
      buttonStyle: "icon-label",
      className: "schedule-publish__delete",
      icon: "x",
      onClick: e => {
        e.preventDefault();
        deleteHandler(doc.id);
      },
      tooltip: t('general:delete')
    }, doc.id))
  });
  return columns;
};
//# sourceMappingURL=buildUpcomingColumns.js.map