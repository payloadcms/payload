'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { useConfig, useTranslation } from '@payloadcms/ui';
import { fieldIsArrayType, fieldIsBlockType } from 'payload/shared';
import React from 'react';
import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js';
import { DiffCollapser } from '../../DiffCollapser/index.js';
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js';
import { getFieldsForRowComparison } from '../../utilities/getFieldsForRowComparison.js';
const baseClass = 'iterable-diff';
export const Iterable = t0 => {
  const $ = _c(12);
  const {
    baseVersionField,
    comparisonValue: valueFrom,
    field,
    locale,
    parentIsLocalized,
    versionValue: valueTo
  } = t0;
  const {
    i18n,
    t
  } = useTranslation();
  const {
    selectedLocales
  } = useSelectedLocales();
  const {
    config
  } = useConfig();
  if (!fieldIsArrayType(field) && !fieldIsBlockType(field)) {
    throw new Error(`Expected field to be an array or blocks type but got: ${field.type}`);
  }
  const valueToRowCount = Array.isArray(valueTo) ? valueTo.length : 0;
  const valueFromRowCount = Array.isArray(valueFrom) ? valueFrom.length : 0;
  const maxRows = Math.max(valueToRowCount, valueFromRowCount);
  let t1;
  if ($[0] !== baseVersionField || $[1] !== config || $[2] !== field || $[3] !== i18n || $[4] !== locale || $[5] !== maxRows || $[6] !== parentIsLocalized || $[7] !== selectedLocales || $[8] !== t || $[9] !== valueFrom || $[10] !== valueTo) {
    t1 = _jsx("div", {
      className: baseClass,
      children: _jsxs(DiffCollapser, {
        field,
        isIterable: true,
        Label: "label" in field && field.label && typeof field.label !== "function" && _jsxs("span", {
          children: [locale && _jsx("span", {
            className: `${baseClass}__locale-label`,
            children: locale
          }), getTranslation(field.label, i18n)]
        }),
        locales: selectedLocales,
        parentIsLocalized,
        valueFrom,
        valueTo,
        children: [maxRows > 0 && _jsx("div", {
          className: `${baseClass}__rows`,
          children: Array.from({
            length: maxRows
          }, (_, i) => {
            const valueToRow = valueTo?.[i] || {};
            const valueFromRow = valueFrom?.[i] || {};
            const {
              fields,
              versionFields
            } = getFieldsForRowComparison({
              baseVersionField,
              config,
              field,
              row: i,
              valueFromRow,
              valueToRow
            });
            if (!versionFields?.length) {
              return null;
            }
            const rowNumber = String(i + 1).padStart(2, "0");
            const rowLabel = fieldIsArrayType(field) ? `${t("general:item")} ${rowNumber}` : `${t("fields:block")} ${rowNumber}`;
            return _jsx("div", {
              className: `${baseClass}__row`,
              children: _jsx(DiffCollapser, {
                fields,
                hideGutter: true,
                Label: _jsxs("div", {
                  className: `${baseClass}-label-container`,
                  children: [_jsx("div", {
                    className: `${baseClass}-label-prefix`
                  }), _jsx("span", {
                    className: `${baseClass}__label`,
                    children: rowLabel
                  })]
                }),
                locales: selectedLocales,
                parentIsLocalized: parentIsLocalized || field.localized,
                valueFrom: valueFromRow,
                valueTo: valueToRow,
                children: _jsx(RenderVersionFieldsToDiff, {
                  versionFields
                })
              })
            }, i);
          })
        }), maxRows === 0 && _jsx("div", {
          className: `${baseClass}__no-rows`,
          children: i18n.t("version:noRowsFound", {
            label: "labels" in field && field.labels?.plural ? getTranslation(field.labels.plural, i18n) : i18n.t("general:rows")
          })
        })]
      })
    });
    $[0] = baseVersionField;
    $[1] = config;
    $[2] = field;
    $[3] = i18n;
    $[4] = locale;
    $[5] = maxRows;
    $[6] = parentIsLocalized;
    $[7] = selectedLocales;
    $[8] = t;
    $[9] = valueFrom;
    $[10] = valueTo;
    $[11] = t1;
  } else {
    t1 = $[11];
  }
  return t1;
};
//# sourceMappingURL=index.js.map