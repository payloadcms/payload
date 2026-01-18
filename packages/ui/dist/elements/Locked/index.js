'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { LockIcon } from '../../icons/Lock/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { isClientUserObject } from '../../utilities/isClientUserObject.js';
import { Tooltip } from '../Tooltip/index.js';
import './index.scss';
const baseClass = 'locked';
export const Locked = t0 => {
  const $ = _c(8);
  const {
    className,
    user
  } = t0;
  const [hovered, setHovered] = useState(false);
  const {
    t
  } = useTranslation();
  const userToUse = isClientUserObject(user) ? user.email ?? user.id : t("general:anotherUser");
  let t1;
  if ($[0] !== className) {
    t1 = [baseClass, className].filter(Boolean);
    $[0] = className;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = t1.join(" ");
  let t3;
  let t4;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = () => setHovered(true);
    t4 = () => setHovered(false);
    $[2] = t3;
    $[3] = t4;
  } else {
    t3 = $[2];
    t4 = $[3];
  }
  const t5 = `${userToUse} ${t("general:isEditing")}`;
  let t6;
  if ($[4] !== hovered || $[5] !== t2 || $[6] !== t5) {
    t6 = _jsxs("div", {
      className: t2,
      onMouseEnter: t3,
      onMouseLeave: t4,
      role: "button",
      tabIndex: 0,
      children: [_jsx(Tooltip, {
        alignCaret: "left",
        className: `${baseClass}__tooltip`,
        position: "top",
        show: hovered,
        children: t5
      }), _jsx(LockIcon, {})]
    });
    $[4] = hovered;
    $[5] = t2;
    $[6] = t5;
    $[7] = t6;
  } else {
    t6 = $[7];
  }
  return t6;
};
//# sourceMappingURL=index.js.map