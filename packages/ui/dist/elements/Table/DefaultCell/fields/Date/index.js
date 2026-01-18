'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { getObjectDotNotation } from 'payload/shared';
import React from 'react';
import { useConfig } from '../../../../../providers/Config/index.js';
import { useTranslation } from '../../../../../providers/Translation/index.js';
import { formatDate } from '../../../../../utilities/formatDocTitle/formatDateTitle.js';
export const DateCell = props => {
  const {
    cellData,
    field: t0,
    rowData
  } = props;
  const {
    name,
    accessor,
    admin: t1,
    timezone: timezoneFromField
  } = t0;
  const {
    date
  } = t1 === undefined ? {} : t1;
  const {
    config: t2
  } = useConfig();
  const {
    admin: t3
  } = t2;
  const {
    dateFormat: dateFormatFromRoot
  } = t3;
  const {
    i18n
  } = useTranslation();
  const fieldPath = accessor || name;
  const timezoneFieldName = `${fieldPath}_tz`;
  const timezone = Boolean(timezoneFromField) && rowData ? getObjectDotNotation(rowData, timezoneFieldName, undefined) : undefined;
  const dateFormat = date?.displayFormat || dateFormatFromRoot;
  return _jsx("span", {
    children: Boolean(cellData) && formatDate({
      date: cellData,
      i18n,
      pattern: dateFormat,
      timezone
    })
  });
};
//# sourceMappingURL=index.js.map