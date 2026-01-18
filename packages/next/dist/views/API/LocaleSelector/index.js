'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { SelectField, useTranslation } from '@payloadcms/ui';
import React from 'react';
export const LocaleSelector = t0 => {
  const $ = _c(6);
  const {
    localeOptions,
    onChange
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== localeOptions || $[1] !== onChange || $[2] !== t) {
    let t2;
    if ($[4] !== onChange) {
      t2 = value => onChange(value);
      $[4] = onChange;
      $[5] = t2;
    } else {
      t2 = $[5];
    }
    t1 = _jsx(SelectField, {
      field: {
        name: "locale",
        label: t("general:locale"),
        options: localeOptions
      },
      onChange: t2,
      path: "locale"
    });
    $[0] = localeOptions;
    $[1] = onChange;
    $[2] = t;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
};
//# sourceMappingURL=index.js.map