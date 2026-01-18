'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { CopyIcon } from '../../icons/Copy/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Tooltip } from '../Tooltip/index.js';
import './index.scss';
const baseClass = 'copy-to-clipboard';
export const CopyToClipboard = t0 => {
  const $ = _c(11);
  const {
    defaultMessage,
    successMessage,
    value
  } = t0;
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const {
    t
  } = useTranslation();
  if (value) {
    let t1;
    if ($[0] !== value) {
      t1 = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      };
      $[0] = value;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    let t2;
    let t3;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = () => {
        setHovered(true);
        setCopied(false);
      };
      t3 = () => {
        setHovered(false);
        setCopied(false);
      };
      $[2] = t2;
      $[3] = t3;
    } else {
      t2 = $[2];
      t3 = $[3];
    }
    let t4;
    if ($[4] !== copied || $[5] !== defaultMessage || $[6] !== hovered || $[7] !== successMessage || $[8] !== t || $[9] !== t1) {
      t4 = _jsxs("button", {
        className: baseClass,
        onClick: t1,
        onMouseEnter: t2,
        onMouseLeave: t3,
        type: "button",
        children: [_jsx(CopyIcon, {}), _jsxs(Tooltip, {
          delay: copied ? 0 : undefined,
          show: hovered || copied,
          children: [copied && (successMessage ?? t("general:copied")), !copied && (defaultMessage ?? t("general:copy"))]
        })]
      });
      $[4] = copied;
      $[5] = defaultMessage;
      $[6] = hovered;
      $[7] = successMessage;
      $[8] = t;
      $[9] = t1;
      $[10] = t4;
    } else {
      t4 = $[10];
    }
    return t4;
  }
  return null;
};
//# sourceMappingURL=index.js.map