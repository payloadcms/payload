'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'field-description';
export const FieldDescription = props => {
  const $ = _c(8);
  const {
    className,
    description,
    marginPlacement,
    path
  } = props;
  const {
    i18n
  } = useTranslation();
  if (description) {
    const t0 = `field-description-${path?.replace(/\./g, "__")}`;
    const t1 = marginPlacement && `${baseClass}--margin-${marginPlacement}`;
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
    const t3 = t2.join(" ");
    let t4;
    if ($[4] !== description || $[5] !== i18n || $[6] !== t3) {
      t4 = _jsx("div", {
        className: t3,
        children: getTranslation(description, i18n)
      });
      $[4] = description;
      $[5] = i18n;
      $[6] = t3;
      $[7] = t4;
    } else {
      t4 = $[7];
    }
    return t4;
  }
  return null;
};
//# sourceMappingURL=index.js.map