'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { XIcon } from '../../../icons/X/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Tooltip } from '../../Tooltip/index.js';
import './index.scss';
const baseClass = 'multi-value-remove';
export const MultiValueRemove = props => {
  const $ = _c(12);
  const {
    innerProps: t0
  } = props;
  const {
    className,
    onClick,
    onTouchEnd
  } = t0;
  const [showTooltip, setShowTooltip] = React.useState(false);
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== className || $[1] !== onClick || $[2] !== onTouchEnd || $[3] !== showTooltip || $[4] !== t) {
    const t2 = t("general:remove");
    let t3;
    if ($[6] !== className) {
      t3 = [baseClass, className].filter(Boolean);
      $[6] = className;
      $[7] = t3;
    } else {
      t3 = $[7];
    }
    let t4;
    if ($[8] !== onClick) {
      t4 = e => {
        setShowTooltip(false);
        onClick(e);
      };
      $[8] = onClick;
      $[9] = t4;
    } else {
      t4 = $[9];
    }
    let t5;
    let t6;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
      t5 = () => setShowTooltip(true);
      t6 = () => setShowTooltip(false);
      $[10] = t5;
      $[11] = t6;
    } else {
      t5 = $[10];
      t6 = $[11];
    }
    t1 = _jsxs("button", {
      "aria-label": t2,
      className: t3.join(" "),
      onClick: t4,
      onKeyDown: _temp,
      onMouseDown: _temp2,
      onMouseEnter: t5,
      onMouseLeave: t6,
      onTouchEnd,
      type: "button",
      children: [_jsx(Tooltip, {
        className: `${baseClass}__tooltip`,
        show: showTooltip,
        children: t("general:remove")
      }), _jsx(XIcon, {
        className: `${baseClass}__icon`
      })]
    });
    $[0] = className;
    $[1] = onClick;
    $[2] = onTouchEnd;
    $[3] = showTooltip;
    $[4] = t;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
};
function _temp(e_0) {
  if (e_0.key === "Enter") {
    e_0.stopPropagation();
  }
}
function _temp2(e_1) {
  return e_1.stopPropagation();
}
//# sourceMappingURL=index.js.map