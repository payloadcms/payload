'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { useRouter } from 'next/navigation.js';
import * as qs from 'qs-esm';
import React, { Fragment } from 'react';
import { useConfig } from '../../providers/Config/index.js';
import { useLocale, useLocaleLoading } from '../../providers/Locale/index.js';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Popup, PopupList } from '../Popup/index.js';
import './index.scss';
import { LocalizerLabel } from './LocalizerLabel/index.js';
const baseClass = 'localizer';
export const Localizer = props => {
  const $ = _c(17);
  const {
    className
  } = props;
  const {
    config: t0
  } = useConfig();
  const {
    localization
  } = t0;
  const router = useRouter();
  const {
    startRouteTransition
  } = useRouteTransition();
  const {
    setLocaleIsLoading
  } = useLocaleLoading();
  const {
    i18n
  } = useTranslation();
  const locale = useLocale();
  if (localization) {
    const {
      locales
    } = localization;
    let t1;
    if ($[0] !== className) {
      t1 = [baseClass, className].filter(Boolean);
      $[0] = className;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    const t2 = t1.join(" ");
    let t3;
    if ($[2] !== i18n || $[3] !== locale || $[4] !== locales || $[5] !== router || $[6] !== setLocaleIsLoading || $[7] !== startRouteTransition || $[8] !== t2) {
      let t4;
      if ($[10] !== i18n || $[11] !== locale || $[12] !== locales || $[13] !== router || $[14] !== setLocaleIsLoading || $[15] !== startRouteTransition) {
        t4 = t5 => {
          const {
            close
          } = t5;
          return _jsx(PopupList.ButtonGroup, {
            children: locales.map(localeOption => {
              const localeOptionLabel = getTranslation(localeOption.label, i18n);
              return _jsx(PopupList.Button, {
                active: locale.code === localeOption.code,
                disabled: locale.code === localeOption.code,
                onClick: () => {
                  setLocaleIsLoading(true);
                  close();
                  const searchParams = new URLSearchParams(window.location.search);
                  const url = qs.stringify({
                    ...qs.parse(searchParams.toString(), {
                      depth: 10,
                      ignoreQueryPrefix: true
                    }),
                    locale: localeOption.code
                  }, {
                    addQueryPrefix: true
                  });
                  startRouteTransition(() => {
                    router.push(url);
                  });
                },
                children: localeOptionLabel !== localeOption.code ? _jsxs(Fragment, {
                  children: [localeOptionLabel, "\xA0", _jsx("span", {
                    className: `${baseClass}__locale-code`,
                    "data-locale": localeOption.code,
                    children: `(${localeOption.code})`
                  })]
                }) : _jsx("span", {
                  className: `${baseClass}__locale-code`,
                  "data-locale": localeOption.code,
                  children: localeOptionLabel
                })
              }, localeOption.code);
            })
          });
        };
        $[10] = i18n;
        $[11] = locale;
        $[12] = locales;
        $[13] = router;
        $[14] = setLocaleIsLoading;
        $[15] = startRouteTransition;
        $[16] = t4;
      } else {
        t4 = $[16];
      }
      t3 = _jsx("div", {
        className: t2,
        children: _jsx(Popup, {
          button: _jsx(LocalizerLabel, {}),
          horizontalAlign: "right",
          render: t4,
          showScrollbar: true,
          size: "large"
        })
      });
      $[2] = i18n;
      $[3] = locale;
      $[4] = locales;
      $[5] = router;
      $[6] = setLocaleIsLoading;
      $[7] = startRouteTransition;
      $[8] = t2;
      $[9] = t3;
    } else {
      t3 = $[9];
    }
    return t3;
  }
  return null;
};
//# sourceMappingURL=index.js.map