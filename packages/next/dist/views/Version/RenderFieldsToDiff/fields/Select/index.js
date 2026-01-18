'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { FieldDiffContainer, getHTMLDiffComponents, useTranslation } from '@payloadcms/ui';
import React from 'react';
const baseClass = 'select-diff';
const getOptionsToRender = (value, options, hasMany) => {
  if (hasMany && Array.isArray(value)) {
    return value.map(val => options.find(option => (typeof option === 'string' ? option : option.value) === val) || String(val));
  }
  return options.find(option => (typeof option === 'string' ? option : option.value) === value) || String(value);
};
/**
 * Translates option labels while ensuring they are strings.
 * If `options.label` is a JSX element, it falls back to `options.value` because `DiffViewer`
 * expects all values to be strings.
 */
const getTranslatedOptions = (options, i18n) => {
  if (Array.isArray(options)) {
    return options.map(option => {
      if (typeof option === 'string') {
        return option;
      }
      const translatedLabel = getTranslation(option.label, i18n);
      // Ensure the result is a string, otherwise use option.value
      return typeof translatedLabel === 'string' ? translatedLabel : option.value;
    }).join(', ');
  }
  if (typeof options === 'string') {
    return options;
  }
  const translatedLabel = getTranslation(options.label, i18n);
  return typeof translatedLabel === 'string' ? translatedLabel : options.value;
};
export const Select = t0 => {
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
  const options = "options" in field && field.options;
  const renderedValueFrom = typeof valueFrom !== "undefined" ? getTranslatedOptions(getOptionsToRender(typeof valueFrom === "string" ? valueFrom : JSON.stringify(valueFrom), options, field.hasMany), i18n) : "";
  const renderedValueTo = typeof valueTo !== "undefined" ? getTranslatedOptions(getOptionsToRender(typeof valueTo === "string" ? valueTo : JSON.stringify(valueTo), options, field.hasMany), i18n) : "";
  const t1 = "<p>" + renderedValueFrom + "</p>";
  const t2 = "<p>" + renderedValueTo + "</p>";
  let t3;
  if ($[0] !== field.label || $[1] !== i18n || $[2] !== locale || $[3] !== nestingLevel || $[4] !== t1 || $[5] !== t2) {
    const {
      From,
      To
    } = getHTMLDiffComponents({
      fromHTML: t1,
      toHTML: t2,
      tokenizeByCharacter: true
    });
    t3 = _jsx(FieldDiffContainer, {
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
    $[4] = t1;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
};
//# sourceMappingURL=index.js.map