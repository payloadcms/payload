'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import md5 from 'md5';
import React from 'react';
import { useAuth } from '../../../providers/Auth/index.js';
export const GravatarAccountIcon = () => {
  const $ = _c(2);
  const {
    user
  } = useAuth();
  const hash = md5(user.email.trim().toLowerCase());
  const params = new URLSearchParams({
    default: "mp",
    r: "g",
    s: "50"
  }).toString();
  const query = `?${params}`;
  const t0 = `https://www.gravatar.com/avatar/${hash}${query}`;
  let t1;
  if ($[0] !== t0) {
    t1 = _jsx("img", {
      alt: "yas",
      className: "gravatar-account",
      height: 25,
      src: t0,
      style: {
        borderRadius: "50%"
      },
      width: 25
    });
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
};
//# sourceMappingURL=index.js.map