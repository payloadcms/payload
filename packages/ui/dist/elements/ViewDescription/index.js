'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useTranslation } from '../../providers/Translation/index.js';
export function isComponent(description) {
  return /*#__PURE__*/React.isValidElement(description);
}
export function ViewDescription(props) {
  const $ = _c(3);
  const {
    i18n
  } = useTranslation();
  const {
    description
  } = props;
  if (description) {
    let t0;
    if ($[0] !== description || $[1] !== i18n) {
      t0 = _jsx("div", {
        className: "custom-view-description",
        children: getTranslation(description, i18n)
      });
      $[0] = description;
      $[1] = i18n;
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    return t0;
  }
  return null;
}
//# sourceMappingURL=index.js.map