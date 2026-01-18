'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { PeopleIcon } from '../../../icons/People/index.js';
import { XIcon } from '../../../icons/X/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Pill } from '../../Pill/index.js';
import './index.scss';
const baseClass = 'active-query-preset';
export function QueryPresetToggler(t0) {
  const $ = _c(11);
  const {
    activePreset,
    openPresetListDrawer,
    resetPreset
  } = t0;
  const {
    i18n,
    t
  } = useTranslation();
  const {
    getEntityConfig
  } = useConfig();
  let t1;
  if ($[0] !== activePreset || $[1] !== getEntityConfig || $[2] !== i18n || $[3] !== openPresetListDrawer || $[4] !== resetPreset || $[5] !== t) {
    const presetsConfig = getEntityConfig({
      collectionSlug: "payload-query-presets"
    });
    const t2 = activePreset && `${baseClass}--active`;
    let t3;
    if ($[7] !== t2) {
      t3 = [baseClass, t2].filter(Boolean);
      $[7] = t2;
      $[8] = t3;
    } else {
      t3 = $[8];
    }
    let t4;
    if ($[9] !== openPresetListDrawer) {
      t4 = () => {
        openPresetListDrawer();
      };
      $[9] = openPresetListDrawer;
      $[10] = t4;
    } else {
      t4 = $[10];
    }
    t1 = _jsx(Pill, {
      className: t3.join(" "),
      id: "select-preset",
      onClick: t4,
      pillStyle: "light",
      size: "small",
      children: _jsxs("div", {
        className: `${baseClass}__label`,
        children: [activePreset?.isShared && _jsx(PeopleIcon, {
          className: `${baseClass}__shared`
        }), _jsx("div", {
          className: `${baseClass}__label-text-max-width`,
          children: _jsx("div", {
            className: `${baseClass}__label-text`,
            children: activePreset?.title || t("general:selectLabel", {
              label: getTranslation(presetsConfig.labels.singular, i18n)
            })
          })
        }), activePreset ? _jsx("div", {
          className: `${baseClass}__clear`,
          id: "clear-preset",
          onClick: async e => {
            e.stopPropagation();
            await resetPreset();
          },
          onKeyDown: async e_0 => {
            if (e_0.key === "Enter" || e_0.key === " ") {
              e_0.stopPropagation();
              await resetPreset();
            }
          },
          role: "button",
          tabIndex: 0,
          children: _jsx(XIcon, {})
        }) : null]
      })
    });
    $[0] = activePreset;
    $[1] = getEntityConfig;
    $[2] = i18n;
    $[3] = openPresetListDrawer;
    $[4] = resetPreset;
    $[5] = t;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}
//# sourceMappingURL=index.js.map