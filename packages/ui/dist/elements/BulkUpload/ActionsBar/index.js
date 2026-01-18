'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ChevronIcon } from '../../../icons/Chevron/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Button } from '../../Button/index.js';
import { EditManyBulkUploads } from '../EditMany/index.js';
import { useFormsManager } from '../FormsManager/index.js';
import './index.scss';
const baseClass = 'bulk-upload--actions-bar';
export function ActionsBar(t0) {
  const $ = _c(15);
  const {
    collectionConfig
  } = t0;
  const {
    activeIndex,
    forms,
    setActiveIndex
  } = useFormsManager();
  const {
    t
  } = useTranslation();
  const t1 = activeIndex + 1;
  let t2;
  if ($[0] !== activeIndex || $[1] !== collectionConfig || $[2] !== forms.length || $[3] !== setActiveIndex || $[4] !== t || $[5] !== t1) {
    let t3;
    if ($[7] !== activeIndex || $[8] !== forms.length || $[9] !== setActiveIndex) {
      t3 = () => {
        const nextIndex = activeIndex - 1;
        if (nextIndex < 0) {
          setActiveIndex(forms.length - 1);
        } else {
          setActiveIndex(nextIndex);
        }
      };
      $[7] = activeIndex;
      $[8] = forms.length;
      $[9] = setActiveIndex;
      $[10] = t3;
    } else {
      t3 = $[10];
    }
    let t4;
    if ($[11] !== activeIndex || $[12] !== forms.length || $[13] !== setActiveIndex) {
      t4 = () => {
        const nextIndex_0 = activeIndex + 1;
        if (nextIndex_0 === forms.length) {
          setActiveIndex(0);
        } else {
          setActiveIndex(nextIndex_0);
        }
      };
      $[11] = activeIndex;
      $[12] = forms.length;
      $[13] = setActiveIndex;
      $[14] = t4;
    } else {
      t4 = $[14];
    }
    t2 = _jsxs("div", {
      className: baseClass,
      children: [_jsxs("div", {
        className: `${baseClass}__navigation`,
        children: [_jsxs("p", {
          className: `${baseClass}__locationText`,
          children: [_jsx("strong", {
            children: t1
          }), ` ${t("general:of")} `, _jsx("strong", {
            children: forms.length
          })]
        }), _jsxs("div", {
          className: `${baseClass}__controls`,
          children: [_jsx(Button, {
            "aria-label": t("general:previous"),
            buttonStyle: "none",
            onClick: t3,
            type: "button",
            children: _jsx(ChevronIcon, {
              direction: "left"
            })
          }), _jsx(Button, {
            "aria-label": t("general:next"),
            buttonStyle: "none",
            onClick: t4,
            type: "button",
            children: _jsx(ChevronIcon, {
              direction: "right"
            })
          })]
        }), _jsx(EditManyBulkUploads, {
          collection: collectionConfig
        })]
      }), _jsx(Actions, {
        className: `${baseClass}__saveButtons`
      })]
    });
    $[0] = activeIndex;
    $[1] = collectionConfig;
    $[2] = forms.length;
    $[3] = setActiveIndex;
    $[4] = t;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}
export function Actions(t0) {
  const $ = _c(12);
  const {
    className
  } = t0;
  const {
    getEntityConfig
  } = useConfig();
  const {
    t
  } = useTranslation();
  const {
    collectionSlug,
    hasPublishPermission,
    hasSavePermission,
    saveAllDocs
  } = useFormsManager();
  let t1;
  if ($[0] !== collectionSlug || $[1] !== getEntityConfig) {
    t1 = getEntityConfig({
      collectionSlug
    });
    $[0] = collectionSlug;
    $[1] = getEntityConfig;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const collectionConfig = t1;
  let t2;
  if ($[3] !== className) {
    t2 = [`${baseClass}__buttons`, className].filter(Boolean);
    $[3] = className;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const t3 = t2.join(" ");
  let t4;
  if ($[5] !== collectionConfig?.versions?.drafts || $[6] !== hasPublishPermission || $[7] !== hasSavePermission || $[8] !== saveAllDocs || $[9] !== t || $[10] !== t3) {
    t4 = _jsxs("div", {
      className: t3,
      children: [collectionConfig?.versions?.drafts && hasSavePermission ? _jsx(Button, {
        buttonStyle: "secondary",
        onClick: () => void saveAllDocs({
          overrides: {
            _status: "draft"
          }
        }),
        children: t("version:saveDraft")
      }) : null, collectionConfig?.versions?.drafts && hasPublishPermission ? _jsx(Button, {
        onClick: () => void saveAllDocs({
          overrides: {
            _status: "published"
          }
        }),
        children: t("version:publish")
      }) : null, !collectionConfig?.versions?.drafts && hasSavePermission ? _jsx(Button, {
        onClick: () => void saveAllDocs(),
        children: t("general:save")
      }) : null]
    });
    $[5] = collectionConfig?.versions?.drafts;
    $[6] = hasPublishPermission;
    $[7] = hasSavePermission;
    $[8] = saveAllDocs;
    $[9] = t;
    $[10] = t3;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  return t4;
}
//# sourceMappingURL=index.js.map