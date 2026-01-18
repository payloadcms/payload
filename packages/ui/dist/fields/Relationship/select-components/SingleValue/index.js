'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Fragment, useState } from 'react';
import { components as SelectComponents } from 'react-select';
import { Tooltip } from '../../../../elements/Tooltip/index.js';
import { EditIcon } from '../../../../icons/Edit/index.js';
import { useAuth } from '../../../../providers/Auth/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'relationship--single-value';
export const SingleValue = props => {
  const $ = _c(16);
  const {
    children,
    data: t0,
    selectProps: t1
  } = props;
  const {
    allowEdit,
    label,
    relationTo,
    value
  } = t0;
  let t2;
  if ($[0] !== t1) {
    t2 = t1 === undefined ? {} : t1;
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const {
    customProps: t3
  } = t2;
  let t4;
  if ($[2] !== t3) {
    t4 = t3 === undefined ? {} : t3;
    $[2] = t3;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  const {
    onDocumentOpen
  } = t4;
  const [showTooltip, setShowTooltip] = useState(false);
  const {
    t
  } = useTranslation();
  const {
    permissions
  } = useAuth();
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read);
  const t5 = label || "";
  let t6;
  if ($[4] !== allowEdit || $[5] !== children || $[6] !== hasReadPermission || $[7] !== label || $[8] !== onDocumentOpen || $[9] !== props || $[10] !== relationTo || $[11] !== showTooltip || $[12] !== t || $[13] !== t5 || $[14] !== value) {
    t6 = _jsx(SelectComponents.SingleValue, {
      ...props,
      className: baseClass,
      children: _jsx("div", {
        className: `${baseClass}__label`,
        title: t5,
        children: _jsxs("div", {
          className: `${baseClass}__label-text`,
          children: [_jsx("div", {
            className: `${baseClass}__text`,
            children
          }), relationTo && hasReadPermission && allowEdit !== false && _jsx(Fragment, {
            children: _jsxs("button", {
              "aria-label": t("general:editLabel", {
                label
              }),
              className: `${baseClass}__drawer-toggler`,
              onClick: event => {
                setShowTooltip(false);
                onDocumentOpen({
                  id: value,
                  collectionSlug: relationTo,
                  hasReadPermission,
                  openInNewTab: event.metaKey || event.ctrlKey
                });
              },
              onKeyDown: _temp,
              onMouseDown: _temp2,
              onMouseEnter: () => setShowTooltip(true),
              onMouseLeave: () => setShowTooltip(false),
              onTouchEnd: _temp3,
              type: "button",
              children: [_jsx(Tooltip, {
                className: `${baseClass}__tooltip`,
                show: showTooltip,
                children: t("general:edit")
              }), _jsx(EditIcon, {})]
            })
          })]
        })
      })
    });
    $[4] = allowEdit;
    $[5] = children;
    $[6] = hasReadPermission;
    $[7] = label;
    $[8] = onDocumentOpen;
    $[9] = props;
    $[10] = relationTo;
    $[11] = showTooltip;
    $[12] = t;
    $[13] = t5;
    $[14] = value;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  return t6;
};
function _temp(e) {
  if (e.key === "Enter") {
    e.stopPropagation();
  }
}
function _temp2(e_0) {
  return e_0.stopPropagation();
}
function _temp3(e_1) {
  return e_1.stopPropagation();
}
//# sourceMappingURL=index.js.map