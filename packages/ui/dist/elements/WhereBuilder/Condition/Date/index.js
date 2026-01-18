'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { DatePickerField } from '../../../DatePicker/index.js';
const baseClass = 'condition-value-date';
export const DateFilter = t0 => {
  const {
    disabled,
    field: t1,
    onChange,
    value
  } = t0;
  const {
    admin
  } = t1;
  const {
    date
  } = admin || {};
  const {
    i18n,
    t
  } = useTranslation();
  return _jsx("div", {
    className: baseClass,
    children: _jsx(DatePickerField, {
      ...date,
      onChange,
      placeholder: getTranslation(admin.placeholder, i18n) || t("general:enterAValue"),
      readOnly: disabled,
      value
    })
  });
};
//# sourceMappingURL=index.js.map