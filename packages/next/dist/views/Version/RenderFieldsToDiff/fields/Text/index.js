'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { FieldDiffContainer, getHTMLDiffComponents, useTranslation } from '@payloadcms/ui';
import React from 'react';
const baseClass = 'text-diff';
function formatValue(value) {
  if (typeof value === 'string') {
    return {
      tokenizeByCharacter: true,
      value
    };
  }
  if (typeof value === 'number') {
    return {
      tokenizeByCharacter: true,
      value: String(value)
    };
  }
  if (typeof value === 'boolean') {
    return {
      tokenizeByCharacter: false,
      value: String(value)
    };
  }
  if (value && typeof value === 'object') {
    return {
      tokenizeByCharacter: false,
      value: `<pre>${JSON.stringify(value, null, 2)}</pre>`
    };
  }
  return {
    tokenizeByCharacter: true,
    value: undefined
  };
}
export const Text = t0 => {
  const $ = _c(8);
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
  let placeholder = "";
  if (valueTo == valueFrom) {
    placeholder = "<span class=\"html-diff-no-value\"><span>";
  }
  let t1;
  if ($[0] !== field.label || $[1] !== i18n || $[2] !== locale || $[3] !== nestingLevel || $[4] !== placeholder || $[5] !== valueFrom || $[6] !== valueTo) {
    const formattedValueFrom = formatValue(valueFrom);
    const formattedValueTo = formatValue(valueTo);
    let tokenizeByCharacter = true;
    if (formattedValueFrom.value?.length) {
      tokenizeByCharacter = formattedValueFrom.tokenizeByCharacter;
    } else {
      if (formattedValueTo.value?.length) {
        tokenizeByCharacter = formattedValueTo.tokenizeByCharacter;
      }
    }
    const renderedValueFrom = formattedValueFrom.value ?? placeholder;
    const renderedValueTo = formattedValueTo.value ?? placeholder;
    const {
      From,
      To
    } = getHTMLDiffComponents({
      fromHTML: "<p>" + renderedValueFrom + "</p>",
      toHTML: "<p>" + renderedValueTo + "</p>",
      tokenizeByCharacter
    });
    t1 = _jsx(FieldDiffContainer, {
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
    $[4] = placeholder;
    $[5] = valueFrom;
    $[6] = valueTo;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  return t1;
};
//# sourceMappingURL=index.js.map