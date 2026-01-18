'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Gutter, useConfig, useStepNav, useTranslation } from '@payloadcms/ui';
import React, { useEffect } from 'react';
const baseClass = 'not-found';
export const NotFoundClient = props => {
  const $ = _c(10);
  const {
    marginTop: t0
  } = props;
  const marginTop = t0 === undefined ? "large" : t0;
  const {
    setStepNav
  } = useStepNav();
  const {
    t
  } = useTranslation();
  const {
    config: t1
  } = useConfig();
  const {
    routes: t2
  } = t1;
  const {
    admin: adminRoute
  } = t2;
  let t3;
  let t4;
  if ($[0] !== setStepNav || $[1] !== t) {
    t3 = () => {
      setStepNav([{
        label: t("general:notFound")
      }]);
    };
    t4 = [setStepNav, t];
    $[0] = setStepNav;
    $[1] = t;
    $[2] = t3;
    $[3] = t4;
  } else {
    t3 = $[2];
    t4 = $[3];
  }
  useEffect(t3, t4);
  const t5 = marginTop && `${baseClass}--margin-top-${marginTop}`;
  let t6;
  if ($[4] !== t5) {
    t6 = [baseClass, t5].filter(Boolean);
    $[4] = t5;
    $[5] = t6;
  } else {
    t6 = $[5];
  }
  const t7 = t6.join(" ");
  let t8;
  if ($[6] !== adminRoute || $[7] !== t || $[8] !== t7) {
    t8 = _jsx("div", {
      className: t7,
      children: _jsxs(Gutter, {
        className: `${baseClass}__wrap`,
        children: [_jsxs("div", {
          className: `${baseClass}__content`,
          children: [_jsx("h1", {
            children: t("general:nothingFound")
          }), _jsx("p", {
            children: t("general:sorryNotFound")
          })]
        }), _jsx(Button, {
          className: `${baseClass}__button`,
          el: "link",
          size: "large",
          to: adminRoute,
          children: t("general:backToDashboard")
        })]
      })
    });
    $[6] = adminRoute;
    $[7] = t;
    $[8] = t7;
    $[9] = t8;
  } else {
    t8 = $[9];
  }
  return t8;
};
//# sourceMappingURL=index.client.js.map