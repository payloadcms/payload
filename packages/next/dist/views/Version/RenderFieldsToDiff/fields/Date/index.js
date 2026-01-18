'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { FieldDiffContainer, getHTMLDiffComponents, useConfig, useTranslation } from '@payloadcms/ui';
import { formatDate } from '@payloadcms/ui/shared';
import React from 'react';
const baseClass = 'date-diff';
export const DateDiffComponent = t0 => {
  const $ = _c(7);
  const {
    comparisonValue: valueFrom,
    field,
    locale,
    nestingLevel,
    versionValue: valueTo
  } = t0;
  const {
    i18n
  } = useTranslation();
  const {
    config: t1
  } = useConfig();
  const {
    admin: t2
  } = t1;
  const {
    dateFormat
  } = t2;
  const formattedFromDate = valueFrom ? formatDate({
    date: typeof valueFrom === "string" ? new Date(valueFrom) : valueFrom,
    i18n,
    pattern: dateFormat
  }) : "";
  const formattedToDate = valueTo ? formatDate({
    date: typeof valueTo === "string" ? new Date(valueTo) : valueTo,
    i18n,
    pattern: dateFormat
  }) : "";
  const t3 = `<div class="${baseClass}" data-enable-match="true" data-date="${formattedFromDate}"><p>` + formattedFromDate + "</p></div>";
  const t4 = `<div class="${baseClass}" data-enable-match="true" data-date="${formattedToDate}"><p>` + formattedToDate + "</p></div>";
  let t5;
  if ($[0] !== field.label || $[1] !== i18n || $[2] !== locale || $[3] !== nestingLevel || $[4] !== t3 || $[5] !== t4) {
    const {
      From,
      To
    } = getHTMLDiffComponents({
      fromHTML: t3,
      toHTML: t4,
      tokenizeByCharacter: false
    });
    t5 = _jsx(FieldDiffContainer, {
      className: baseClass,
      From,
      i18n,
      label: {
        label: field.label,
        locale
      },
      nestingLevel,
      To
    });
    $[0] = field.label;
    $[1] = i18n;
    $[2] = locale;
    $[3] = nestingLevel;
    $[4] = t3;
    $[5] = t4;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  return t5;
};
//# sourceMappingURL=index.js.map