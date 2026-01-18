'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { useTranslation } from '@payloadcms/ui';
import React from 'react';
import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js';
import { DiffCollapser } from '../../DiffCollapser/index.js';
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js';
const baseClass = 'group-diff';
export const Group = t0 => {
  const $ = _c(9);
  const {
    baseVersionField,
    comparisonValue: valueFrom,
    field,
    locale,
    parentIsLocalized,
    versionValue: valueTo
  } = t0;
  const {
    i18n
  } = useTranslation();
  const {
    selectedLocales
  } = useSelectedLocales();
  let t1;
  if ($[0] !== baseVersionField.fields || $[1] !== field || $[2] !== i18n || $[3] !== locale || $[4] !== parentIsLocalized || $[5] !== selectedLocales || $[6] !== valueFrom || $[7] !== valueTo) {
    t1 = _jsx("div", {
      className: baseClass,
      children: _jsx(DiffCollapser, {
        fields: field.fields,
        Label: "label" in field && field.label && typeof field.label !== "function" ? _jsxs("span", {
          children: [locale && _jsx("span", {
            className: `${baseClass}__locale-label`,
            children: locale
          }), getTranslation(field.label, i18n)]
        }) : _jsxs("span", {
          className: `${baseClass}__locale-label ${baseClass}__locale-label--no-label`,
          children: ["<", i18n.t("version:noLabelGroup"), ">"]
        }),
        locales: selectedLocales,
        parentIsLocalized: parentIsLocalized || field.localized,
        valueFrom,
        valueTo,
        children: _jsx(RenderVersionFieldsToDiff, {
          versionFields: baseVersionField.fields
        })
      })
    });
    $[0] = baseVersionField.fields;
    $[1] = field;
    $[2] = i18n;
    $[3] = locale;
    $[4] = parentIsLocalized;
    $[5] = selectedLocales;
    $[6] = valueFrom;
    $[7] = valueTo;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  return t1;
};
//# sourceMappingURL=index.js.map