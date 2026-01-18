'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { useTranslation } from '@payloadcms/ui';
import React from 'react';
import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js';
import { DiffCollapser } from '../../DiffCollapser/index.js';
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js';
const baseClass = 'tabs-diff';
export const Tabs = props => {
  const $ = _c(13);
  const {
    baseVersionField,
    comparisonValue: valueFrom,
    field,
    versionValue: valueTo
  } = props;
  const {
    selectedLocales
  } = useSelectedLocales();
  let t0;
  if ($[0] !== baseVersionField.tabs || $[1] !== field || $[2] !== props || $[3] !== selectedLocales || $[4] !== valueFrom || $[5] !== valueTo) {
    let t1;
    if ($[7] !== field || $[8] !== props || $[9] !== selectedLocales || $[10] !== valueFrom || $[11] !== valueTo) {
      t1 = (tab, i) => {
        if (!tab?.fields?.length) {
          return null;
        }
        const fieldTab = field.tabs?.[i];
        return _jsx("div", {
          className: `${baseClass}__tab`,
          children: (() => {
            if ("name" in fieldTab && selectedLocales && fieldTab.localized) {
              return selectedLocales.map((locale, index) => {
                const localizedTabProps = {
                  ...props,
                  comparisonValue: valueFrom?.[tab.name]?.[locale],
                  fieldTab,
                  locale,
                  tab,
                  versionValue: valueTo?.[tab.name]?.[locale]
                };
                return _jsx("div", {
                  className: `${baseClass}__tab-locale`,
                  children: _jsx("div", {
                    className: `${baseClass}__tab-locale-value`,
                    children: _jsx(Tab, {
                      ...localizedTabProps
                    }, locale)
                  })
                }, [locale, index].join("-"));
              });
            } else {
              if ("name" in tab && tab.name) {
                const namedTabProps = {
                  ...props,
                  comparisonValue: valueFrom?.[tab.name],
                  fieldTab,
                  tab,
                  versionValue: valueTo?.[tab.name]
                };
                return _jsx(Tab, {
                  ...namedTabProps
                }, i);
              } else {
                return _jsx(Tab, {
                  fieldTab,
                  ...props,
                  tab
                }, i);
              }
            }
          })()
        }, i);
      };
      $[7] = field;
      $[8] = props;
      $[9] = selectedLocales;
      $[10] = valueFrom;
      $[11] = valueTo;
      $[12] = t1;
    } else {
      t1 = $[12];
    }
    t0 = _jsx("div", {
      className: baseClass,
      children: baseVersionField.tabs.map(t1)
    });
    $[0] = baseVersionField.tabs;
    $[1] = field;
    $[2] = props;
    $[3] = selectedLocales;
    $[4] = valueFrom;
    $[5] = valueTo;
    $[6] = t0;
  } else {
    t0 = $[6];
  }
  return t0;
};
const Tab = t0 => {
  const $ = _c(10);
  const {
    comparisonValue: valueFrom,
    fieldTab,
    locale,
    parentIsLocalized,
    tab,
    versionValue: valueTo
  } = t0;
  const {
    i18n
  } = useTranslation();
  const {
    selectedLocales
  } = useSelectedLocales();
  if (!tab.fields?.length) {
    return null;
  }
  let t1;
  if ($[0] !== fieldTab.fields || $[1] !== fieldTab.localized || $[2] !== i18n || $[3] !== locale || $[4] !== parentIsLocalized || $[5] !== selectedLocales || $[6] !== tab || $[7] !== valueFrom || $[8] !== valueTo) {
    t1 = _jsx(DiffCollapser, {
      fields: fieldTab.fields,
      Label: "label" in tab && tab.label && typeof tab.label !== "function" && _jsxs("span", {
        children: [locale && _jsx("span", {
          className: `${baseClass}__locale-label`,
          children: locale
        }), getTranslation(tab.label, i18n)]
      }),
      locales: selectedLocales,
      parentIsLocalized: parentIsLocalized || fieldTab.localized,
      valueFrom,
      valueTo,
      children: _jsx(RenderVersionFieldsToDiff, {
        versionFields: tab.fields
      })
    });
    $[0] = fieldTab.fields;
    $[1] = fieldTab.localized;
    $[2] = i18n;
    $[3] = locale;
    $[4] = parentIsLocalized;
    $[5] = selectedLocales;
    $[6] = tab;
    $[7] = valueFrom;
    $[8] = valueTo;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  return t1;
};
//# sourceMappingURL=index.js.map