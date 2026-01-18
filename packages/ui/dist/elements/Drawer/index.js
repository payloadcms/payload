'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal, useModal } from '@faceless-ui/modal';
import React, { createContext, use, useCallback, useLayoutEffect, useState } from 'react';
import { XIcon } from '../../icons/X/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Gutter } from '../Gutter/index.js';
import './index.scss';
const baseClass = 'drawer';
export const drawerZBase = 100;
export const formatDrawerSlug = ({
  slug,
  depth
}) => `drawer_${depth}_${slug}`;
export { useDrawerSlug } from './useDrawerSlug.js';
export const DrawerToggler = t0 => {
  const $ = _c(4);
  const {
    slug,
    children,
    className,
    disabled,
    onClick,
    ...rest
  } = t0;
  const {
    openModal
  } = useModal();
  let t1;
  if ($[0] !== onClick || $[1] !== openModal || $[2] !== slug) {
    t1 = e => {
      openModal(slug);
      if (typeof onClick === "function") {
        onClick(e);
      }
    };
    $[0] = onClick;
    $[1] = openModal;
    $[2] = slug;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const handleClick = t1;
  return _jsx("button", {
    className,
    disabled,
    onClick: handleClick,
    type: "button",
    ...rest,
    children
  });
};
export const Drawer = t0 => {
  const $ = _c(22);
  const {
    slug,
    children,
    className,
    gutter: t1,
    Header,
    hoverTitle,
    title
  } = t0;
  const gutter = t1 === undefined ? true : t1;
  const {
    t
  } = useTranslation();
  const {
    closeModal,
    modalState
  } = useModal();
  const drawerDepth = useDrawerDepth();
  const isOpen = !!modalState[slug]?.isOpen;
  const [animateIn, setAnimateIn] = useState(isOpen);
  let t2;
  let t3;
  if ($[0] !== isOpen) {
    t2 = () => {
      setAnimateIn(isOpen);
    };
    t3 = [isOpen];
    $[0] = isOpen;
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  useLayoutEffect(t2, t3);
  if (isOpen) {
    const t4 = animateIn && `${baseClass}--is-open`;
    const t5 = drawerDepth > 1 && `${baseClass}--nested`;
    let t6;
    if ($[3] !== className || $[4] !== t4 || $[5] !== t5) {
      t6 = [className, baseClass, t4, t5].filter(Boolean);
      $[3] = className;
      $[4] = t4;
      $[5] = t5;
      $[6] = t6;
    } else {
      t6 = $[6];
    }
    const t7 = t6.join(" ");
    const t8 = drawerZBase + drawerDepth;
    let t9;
    if ($[7] !== Header || $[8] !== children || $[9] !== closeModal || $[10] !== drawerDepth || $[11] !== gutter || $[12] !== hoverTitle || $[13] !== slug || $[14] !== t || $[15] !== t7 || $[16] !== t8 || $[17] !== title) {
      let t10;
      if ($[19] !== closeModal || $[20] !== slug) {
        t10 = () => closeModal(slug);
        $[19] = closeModal;
        $[20] = slug;
        $[21] = t10;
      } else {
        t10 = $[21];
      }
      t9 = _jsx(DrawerDepthProvider, {
        children: _jsxs(Modal, {
          className: t7,
          closeOnBlur: false,
          slug,
          style: {
            zIndex: t8
          },
          children: [(!drawerDepth || drawerDepth === 1) && _jsx("div", {
            className: `${baseClass}__blur-bg`
          }), _jsx("button", {
            "aria-label": t("general:close"),
            className: `${baseClass}__close`,
            id: `close-drawer__${slug}`,
            onClick: t10,
            type: "button"
          }), _jsxs("div", {
            className: `${baseClass}__content`,
            style: {
              width: `calc(100% - (${drawerDepth} * var(--gutter-h)))`
            },
            children: [_jsx("div", {
              className: `${baseClass}__blur-bg-content`
            }), _jsxs(Gutter, {
              className: `${baseClass}__content-children`,
              left: gutter,
              right: gutter,
              children: [Header, Header === undefined && _jsxs("div", {
                className: `${baseClass}__header`,
                children: [_jsx("h2", {
                  className: `${baseClass}__header__title`,
                  title: hoverTitle ? title : null,
                  children: title
                }), _jsx("button", {
                  "aria-label": t("general:close"),
                  className: `${baseClass}__header__close`,
                  id: `close-drawer__${slug}`,
                  onClick: () => closeModal(slug),
                  type: "button",
                  children: _jsx(XIcon, {})
                })]
              }), children]
            })]
          })]
        })
      });
      $[7] = Header;
      $[8] = children;
      $[9] = closeModal;
      $[10] = drawerDepth;
      $[11] = gutter;
      $[12] = hoverTitle;
      $[13] = slug;
      $[14] = t;
      $[15] = t7;
      $[16] = t8;
      $[17] = title;
      $[18] = t9;
    } else {
      t9 = $[18];
    }
    return t9;
  }
  return null;
};
export const DrawerDepthContext = /*#__PURE__*/createContext(1);
export const DrawerDepthProvider = t0 => {
  const $ = _c(3);
  const {
    children
  } = t0;
  const parentDepth = useDrawerDepth();
  const depth = parentDepth + 1;
  let t1;
  if ($[0] !== children || $[1] !== depth) {
    t1 = _jsx(DrawerDepthContext, {
      value: depth,
      children
    });
    $[0] = children;
    $[1] = depth;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
export const useDrawerDepth = () => use(DrawerDepthContext);
//# sourceMappingURL=index.js.map