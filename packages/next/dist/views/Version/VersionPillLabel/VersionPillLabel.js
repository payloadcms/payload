'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pill, useConfig, useTranslation } from '@payloadcms/ui';
import { formatDate } from '@payloadcms/ui/shared';
import React from 'react';
import { getVersionLabel } from './getVersionLabel.js';
const baseClass = 'version-pill-label';
const renderPill = (label, pillStyle) => {
  return /*#__PURE__*/_jsx(Pill, {
    pillStyle: pillStyle,
    size: "small",
    children: label
  });
};
export const VersionPillLabel = t0 => {
  const $ = _c(13);
  const {
    currentlyPublishedVersion,
    disableDate: t1,
    doc,
    labelFirst: t2,
    labelOverride,
    labelStyle: t3,
    labelSuffix,
    latestDraftVersion
  } = t0;
  const disableDate = t1 === undefined ? false : t1;
  const labelFirst = t2 === undefined ? false : t2;
  const labelStyle = t3 === undefined ? "pill" : t3;
  const {
    config: t4
  } = useConfig();
  const {
    admin: t5,
    localization
  } = t4;
  const {
    dateFormat
  } = t5;
  const {
    i18n,
    t
  } = useTranslation();
  let t6;
  if ($[0] !== currentlyPublishedVersion || $[1] !== dateFormat || $[2] !== disableDate || $[3] !== doc || $[4] !== i18n || $[5] !== labelFirst || $[6] !== labelOverride || $[7] !== labelStyle || $[8] !== labelSuffix || $[9] !== latestDraftVersion || $[10] !== localization || $[11] !== t) {
    const {
      label,
      pillStyle
    } = getVersionLabel({
      currentlyPublishedVersion,
      latestDraftVersion,
      t,
      version: doc
    });
    const labelText = _jsxs("span", {
      children: [labelOverride || label, labelSuffix]
    });
    const showDate = !disableDate && doc.updatedAt;
    const formattedDate = showDate ? formatDate({
      date: doc.updatedAt,
      i18n,
      pattern: dateFormat
    }) : null;
    const localeCode = Array.isArray(doc.publishedLocale) ? doc.publishedLocale[0] : doc.publishedLocale;
    const locale = localization && localization?.locales ? localization.locales.find(loc => loc.code === localeCode) : null;
    const localeLabel = locale ? locale?.label?.[i18n?.language] || locale?.label : null;
    t6 = _jsxs("div", {
      className: baseClass,
      children: [labelFirst ? _jsxs(React.Fragment, {
        children: [labelStyle === "pill" ? renderPill(labelText, pillStyle) : _jsx("span", {
          className: `${baseClass}-text`,
          children: labelText
        }), showDate && _jsx("span", {
          className: `${baseClass}-date`,
          children: formattedDate
        })]
      }) : _jsxs(React.Fragment, {
        children: [showDate && _jsx("span", {
          className: `${baseClass}-date`,
          children: formattedDate
        }), labelStyle === "pill" ? renderPill(labelText, pillStyle) : _jsx("span", {
          className: `${baseClass}-text`,
          children: labelText
        })]
      }), localeLabel && _jsx(Pill, {
        size: "small",
        children: localeLabel
      })]
    });
    $[0] = currentlyPublishedVersion;
    $[1] = dateFormat;
    $[2] = disableDate;
    $[3] = doc;
    $[4] = i18n;
    $[5] = labelFirst;
    $[6] = labelOverride;
    $[7] = labelStyle;
    $[8] = labelSuffix;
    $[9] = latestDraftVersion;
    $[10] = localization;
    $[11] = t;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  return t6;
};
//# sourceMappingURL=VersionPillLabel.js.map