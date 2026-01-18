'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { useTranslation } from '@payloadcms/ui';
import React from 'react';
import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js';
import { DiffCollapser } from '../../DiffCollapser/index.js';
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js';
const baseClass = 'collapsible-diff';
export const Collapsible = t0 => {
  const $ = _c(8);
  const {
    baseVersionField,
    comparisonValue: valueFrom,
    field,
    parentIsLocalized,
    versionValue: valueTo
  } = t0;
  const {
    i18n
  } = useTranslation();
  const {
    selectedLocales
  } = useSelectedLocales();
  if (!baseVersionField.fields?.length) {
    return null;
  }
  let t1;
  if ($[0] !== baseVersionField.fields || $[1] !== field || $[2] !== i18n || $[3] !== parentIsLocalized || $[4] !== selectedLocales || $[5] !== valueFrom || $[6] !== valueTo) {
    t1 = _jsx("div", {
      className: baseClass,
      children: _jsx(DiffCollapser, {
        fields: field.fields,
        Label: "label" in field && field.label && typeof field.label !== "function" && _jsx("span", {
          children: getTranslation(field.label, i18n)
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
    $[3] = parentIsLocalized;
    $[4] = selectedLocales;
    $[5] = valueFrom;
    $[6] = valueTo;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  return t1;
};
//# sourceMappingURL=index.js.map