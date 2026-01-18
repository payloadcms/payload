'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// TODO: abstract the `next/navigation` dependency out from this component
import { collectionDefaults, isNumber } from 'payload/shared';
import React from 'react';
import { ChevronIcon } from '../../icons/Chevron/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Popup, PopupList } from '../Popup/index.js';
import './index.scss';
const baseClass = 'per-page';
const defaultLimits = collectionDefaults.admin.pagination.limits;
export const PerPage = t0 => {
  const $ = _c(9);
  const {
    defaultLimit: t1,
    handleChange,
    limit,
    limits: t2
  } = t0;
  const defaultLimit = t1 === undefined ? 10 : t1;
  const limits = t2 === undefined ? defaultLimits : t2;
  const {
    t
  } = useTranslation();
  const limitToUse = isNumber(limit) ? limit : defaultLimit;
  let t3;
  if ($[0] !== handleChange || $[1] !== limitToUse || $[2] !== limits || $[3] !== t) {
    let t4;
    if ($[5] !== handleChange || $[6] !== limitToUse || $[7] !== limits) {
      t4 = t5 => {
        const {
          close
        } = t5;
        return _jsx(PopupList.ButtonGroup, {
          children: limits.map((limitNumber, i) => _jsxs(PopupList.Button, {
            className: [`${baseClass}__button`, limitNumber === limitToUse && `${baseClass}__button-active`].filter(Boolean).join(" "),
            onClick: () => {
              close();
              if (handleChange) {
                handleChange(limitNumber);
              }
            },
            children: [limitNumber === limitToUse && _jsx("div", {
              className: `${baseClass}__chevron`,
              children: _jsx(ChevronIcon, {
                direction: "right",
                size: "small"
              })
            }), "\xA0", _jsx("span", {
              children: limitNumber
            })]
          }, i))
        });
      };
      $[5] = handleChange;
      $[6] = limitToUse;
      $[7] = limits;
      $[8] = t4;
    } else {
      t4 = $[8];
    }
    t3 = _jsx("div", {
      className: baseClass,
      children: _jsx(Popup, {
        button: _jsxs("div", {
          className: `${baseClass}__base-button`,
          children: [_jsx("span", {
            children: t("general:perPage", {
              limit: limitToUse
            })
          }), "\xA0", _jsx(ChevronIcon, {
            className: `${baseClass}__icon`
          })]
        }),
        horizontalAlign: "right",
        render: t4,
        size: "small"
      })
    });
    $[0] = handleChange;
    $[1] = limitToUse;
    $[2] = limits;
    $[3] = t;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
};
//# sourceMappingURL=index.js.map