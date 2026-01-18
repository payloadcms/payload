'use client';

import { c as _c } from "react/compiler-runtime";
import { useStepNav, useTranslation } from '@payloadcms/ui';
import React from 'react';
export const AccountClient = () => {
  const $ = _c(4);
  const {
    setStepNav
  } = useStepNav();
  const {
    t
  } = useTranslation();
  let t0;
  let t1;
  if ($[0] !== setStepNav || $[1] !== t) {
    t0 = () => {
      const nav = [];
      nav.push({
        label: t("authentication:account"),
        url: "/account"
      });
      setStepNav(nav);
    };
    t1 = [setStepNav, t];
    $[0] = setStepNav;
    $[1] = t;
    $[2] = t0;
    $[3] = t1;
  } else {
    t0 = $[2];
    t1 = $[3];
  }
  React.useEffect(t0, t1);
  return null;
};
//# sourceMappingURL=index.client.js.map