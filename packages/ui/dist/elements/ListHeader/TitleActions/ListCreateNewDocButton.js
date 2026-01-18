'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Button } from '../../Button/index.js';
const baseClass = 'list-create-new-doc';
export function ListCreateNewButton(t0) {
  const $ = _c(5);
  const {
    collectionConfig,
    hasCreatePermission,
    newDocumentURL
  } = t0;
  const {
    i18n,
    t
  } = useTranslation();
  if (!hasCreatePermission) {
    return null;
  }
  const t1 = collectionConfig?.labels?.singular;
  let t2;
  if ($[0] !== i18n || $[1] !== newDocumentURL || $[2] !== t || $[3] !== t1) {
    t2 = _jsx(Button, {
      "aria-label": t("general:createNewLabel", {
        label: getTranslation(t1, i18n)
      }),
      buttonStyle: "pill",
      className: `${baseClass}__create-new-button`,
      el: "link",
      size: "small",
      to: newDocumentURL,
      children: t("general:createNew")
    }, "create-new-button");
    $[0] = i18n;
    $[1] = newDocumentURL;
    $[2] = t;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}
//# sourceMappingURL=ListCreateNewDocButton.js.map