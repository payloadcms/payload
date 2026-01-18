'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React, { Fragment } from 'react';
import { PayloadIcon } from '../../graphics/Icon/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Link } from '../Link/index.js';
import { RenderCustomComponent } from '../RenderCustomComponent/index.js';
import { StepNavProvider, useStepNav } from './context.js';
import './index.scss';
export { SetStepNav } from './SetStepNav.js';
const baseClass = 'step-nav';
const StepNav = t0 => {
  const $ = _c(7);
  const {
    className,
    CustomIcon
  } = t0;
  const {
    i18n
  } = useTranslation();
  const {
    stepNav
  } = useStepNav();
  const {
    config: t1
  } = useConfig();
  const {
    routes: t2
  } = t1;
  const {
    admin
  } = t2;
  const {
    t
  } = useTranslation();
  let t3;
  if ($[0] !== CustomIcon || $[1] !== admin || $[2] !== className || $[3] !== i18n || $[4] !== stepNav || $[5] !== t) {
    t3 = _jsx(Fragment, {
      children: stepNav.length > 0 ? _jsxs("nav", {
        className: [baseClass, className].filter(Boolean).join(" "),
        children: [_jsx(Link, {
          className: `${baseClass}__home`,
          href: admin,
          prefetch: false,
          tabIndex: 0,
          children: _jsx("span", {
            title: t("general:dashboard"),
            children: _jsx(RenderCustomComponent, {
              CustomComponent: CustomIcon,
              Fallback: _jsx(PayloadIcon, {})
            })
          })
        }), _jsx("span", {
          children: "/"
        }), stepNav.map((item, i) => {
          const StepLabel = getTranslation(item.label, i18n);
          const isLast = stepNav.length === i + 1;
          const Step = isLast ? _jsx("span", {
            className: `${baseClass}__last`,
            children: StepLabel
          }, i) : _jsxs(Fragment, {
            children: [item.url ? _jsx(Link, {
              href: item.url,
              prefetch: false,
              children: _jsx("span", {
                children: StepLabel
              }, i)
            }) : _jsx("span", {
              children: StepLabel
            }, i), _jsx("span", {
              children: "/"
            })]
          }, i);
          return Step;
        })]
      }) : _jsx("div", {
        className: [baseClass, className].filter(Boolean).join(" "),
        children: _jsx("div", {
          className: `${baseClass}__home`,
          children: _jsx("span", {
            title: t("general:dashboard"),
            children: _jsx(RenderCustomComponent, {
              CustomComponent: CustomIcon,
              Fallback: _jsx(PayloadIcon, {})
            })
          })
        })
      })
    });
    $[0] = CustomIcon;
    $[1] = admin;
    $[2] = className;
    $[3] = i18n;
    $[4] = stepNav;
    $[5] = t;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
};
export { StepNav, StepNavProvider, useStepNav };
//# sourceMappingURL=index.js.map