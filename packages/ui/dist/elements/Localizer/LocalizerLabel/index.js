'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { ChevronIcon } from '../../../icons/Chevron/index.js';
import { useLocale } from '../../../providers/Locale/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'localizer-button';
export const LocalizerLabel = props => {
  const $ = _c(8);
  const {
    ariaLabel,
    className
  } = props;
  const locale = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  let t0;
  if ($[0] !== ariaLabel || $[1] !== className || $[2] !== i18n || $[3] !== locale || $[4] !== t) {
    let t1;
    if ($[6] !== className) {
      t1 = [baseClass, className].filter(Boolean);
      $[6] = className;
      $[7] = t1;
    } else {
      t1 = $[7];
    }
    t0 = _jsxs("div", {
      "aria-label": ariaLabel || t("general:locale"),
      className: t1.join(" "),
      "data-locale": locale ? locale.code : undefined,
      children: [_jsxs("div", {
        className: `${baseClass}__label`,
        children: [`${t("general:locale")}:`, "\xA0"]
      }), _jsxs("div", {
        className: `${baseClass}__current`,
        children: [_jsx("span", {
          className: `${baseClass}__current-label`,
          children: `${getTranslation(locale.label, i18n)}`
        }), _jsx(ChevronIcon, {
          className: `${baseClass}__chevron`
        })]
      })]
    });
    $[0] = ariaLabel;
    $[1] = className;
    $[2] = i18n;
    $[3] = locale;
    $[4] = t;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
};
//# sourceMappingURL=index.js.map