'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from '../../providers/Translation/index.js';
import { Button } from '../Button/index.js';
import './index.scss';
const baseClass = 'list-selection';
export function ListSelection_v4(t0) {
  const $ = _c(5);
  const {
    count,
    ListActions,
    SelectionActions
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== ListActions || $[1] !== SelectionActions || $[2] !== count || $[3] !== t) {
    t1 = _jsxs("div", {
      className: baseClass,
      children: [_jsx("span", {
        children: t("general:selectedCount", {
          count,
          label: ""
        })
      }), ListActions && ListActions.length > 0 && _jsxs(React.Fragment, {
        children: [_jsx("span", {
          children: "\u2014"
        }), _jsx("div", {
          className: `${baseClass}__actions`,
          children: ListActions
        })]
      }), SelectionActions && SelectionActions.length > 0 && _jsxs(React.Fragment, {
        children: [_jsx("span", {
          children: "\u2014"
        }), _jsx("div", {
          className: `${baseClass}__actions`,
          children: SelectionActions
        })]
      })]
    });
    $[0] = ListActions;
    $[1] = SelectionActions;
    $[2] = count;
    $[3] = t;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}
export function ListSelectionButton({
  children,
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx(Button, {
    ...props,
    buttonStyle: "none",
    className: [`${baseClass}__button`, className].filter(Boolean).join(' '),
    children: children
  });
}
//# sourceMappingURL=index.js.map