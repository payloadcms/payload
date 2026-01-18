'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { ReactSelect, useTranslation } from '@payloadcms/ui';
import React from 'react';
export const LanguageSelector = props => {
  const $ = _c(8);
  const {
    languageOptions
  } = props;
  const {
    i18n,
    switchLanguage
  } = useTranslation();
  let t0;
  if ($[0] !== switchLanguage) {
    t0 = async option => {
      await switchLanguage(option.value);
    };
    $[0] = switchLanguage;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== i18n || $[3] !== languageOptions || $[4] !== t0) {
    let t2;
    if ($[6] !== i18n) {
      t2 = language => language.value === i18n.language;
      $[6] = i18n;
      $[7] = t2;
    } else {
      t2 = $[7];
    }
    t1 = _jsx(ReactSelect, {
      inputId: "language-select",
      isClearable: false,
      onChange: t0,
      options: languageOptions,
      value: languageOptions.find(t2)
    });
    $[2] = i18n;
    $[3] = languageOptions;
    $[4] = t0;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
};
//# sourceMappingURL=LanguageSelector.js.map