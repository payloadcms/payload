'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useConfig } from '../../providers/Config/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { formatDocTitle } from '../../utilities/formatDocTitle/index.js';
import './index.scss';
const baseClass = 'thumbnail-card';
export const ThumbnailCard = props => {
  const $ = _c(13);
  const {
    alignLabel,
    className,
    collection,
    doc,
    label: labelFromProps,
    onClick,
    thumbnail
  } = props;
  const {
    config
  } = useConfig();
  const {
    i18n
  } = useTranslation();
  const t0 = typeof onClick === "function" && `${baseClass}--has-on-click`;
  const t1 = alignLabel && `${baseClass}--align-label-${alignLabel}`;
  let t2;
  if ($[0] !== className || $[1] !== t0 || $[2] !== t1) {
    t2 = [baseClass, className, t0, t1].filter(Boolean);
    $[0] = className;
    $[1] = t0;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const classes = t2.join(" ");
  let t3;
  if ($[4] !== classes || $[5] !== collection || $[6] !== config || $[7] !== doc || $[8] !== i18n || $[9] !== labelFromProps || $[10] !== onClick || $[11] !== thumbnail) {
    let title = labelFromProps;
    if (!title) {
      title = formatDocTitle({
        collectionConfig: collection,
        data: doc,
        dateFormat: config.admin.dateFormat,
        fallback: doc?.filename,
        i18n
      });
    }
    t3 = _jsxs("button", {
      className: classes,
      onClick,
      title,
      type: "button",
      children: [_jsx("div", {
        className: `${baseClass}__thumbnail`,
        children: thumbnail
      }), _jsx("div", {
        className: `${baseClass}__label`,
        children: title
      })]
    });
    $[4] = classes;
    $[5] = collection;
    $[6] = config;
    $[7] = doc;
    $[8] = i18n;
    $[9] = labelFromProps;
    $[10] = onClick;
    $[11] = thumbnail;
    $[12] = t3;
  } else {
    t3 = $[12];
  }
  return t3;
};
//# sourceMappingURL=index.js.map