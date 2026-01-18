'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { tabHasName } from 'payload/shared';
import React, { useState } from 'react';
import { ErrorPill } from '../../../elements/ErrorPill/index.js';
import { WatchChildErrors } from '../../../forms/WatchChildErrors/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'tabs-field__tab-button';
export const TabComponent = t0 => {
  const $ = _c(12);
  const {
    hidden,
    isActive,
    parentPath,
    setIsActive,
    tab
  } = t0;
  const {
    i18n
  } = useTranslation();
  const [errorCount, setErrorCount] = useState(undefined);
  let t1;
  if ($[0] !== errorCount || $[1] !== hidden || $[2] !== i18n || $[3] !== isActive || $[4] !== parentPath || $[5] !== setIsActive || $[6] !== tab) {
    const path = [...(parentPath ? parentPath.split(".").slice(0, -1) : []), ...(tabHasName(tab) ? [tab.name] : [])];
    const fieldHasErrors = errorCount > 0;
    const t2 = _jsx(WatchChildErrors, {
      fields: tab.fields,
      path,
      setErrorCount
    });
    const t3 = fieldHasErrors && `${baseClass}--has-error`;
    const t4 = isActive && `${baseClass}--active`;
    const t5 = hidden && `${baseClass}--hidden`;
    let t6;
    if ($[8] !== t3 || $[9] !== t4 || $[10] !== t5) {
      t6 = [baseClass, t3, t4, t5].filter(Boolean);
      $[8] = t3;
      $[9] = t4;
      $[10] = t5;
      $[11] = t6;
    } else {
      t6 = $[11];
    }
    t1 = _jsxs(React.Fragment, {
      children: [t2, _jsxs("button", {
        className: t6.join(" "),
        onClick: setIsActive,
        type: "button",
        children: [tab.label ? getTranslation(tab.label, i18n) : tabHasName(tab) ? tab.name : "", fieldHasErrors && _jsx(ErrorPill, {
          count: errorCount,
          i18n
        })]
      })]
    });
    $[0] = errorCount;
    $[1] = hidden;
    $[2] = i18n;
    $[3] = isActive;
    $[4] = parentPath;
    $[5] = setIsActive;
    $[6] = tab;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  return t1;
};
//# sourceMappingURL=index.js.map