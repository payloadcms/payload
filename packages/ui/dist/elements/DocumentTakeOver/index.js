'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { useRouteCache } from '../../providers/RouteCache/index.js';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Button } from '../Button/index.js';
import { Modal, useModal } from '../Modal/index.js';
import './index.scss';
const modalSlug = 'document-take-over';
const baseClass = 'document-take-over';
export const DocumentTakeOver = t0 => {
  const $ = _c(19);
  const {
    handleBackToDashboard,
    isActive,
    onReadOnly
  } = t0;
  const {
    closeModal,
    openModal
  } = useModal();
  const {
    t
  } = useTranslation();
  const {
    startRouteTransition
  } = useRouteTransition();
  const {
    clearRouteCache
  } = useRouteCache();
  let t1;
  let t2;
  if ($[0] !== closeModal || $[1] !== isActive || $[2] !== openModal) {
    t1 = () => {
      if (isActive) {
        openModal(modalSlug);
      } else {
        closeModal(modalSlug);
      }
    };
    t2 = [isActive, openModal, closeModal];
    $[0] = closeModal;
    $[1] = isActive;
    $[2] = openModal;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== clearRouteCache || $[6] !== closeModal || $[7] !== handleBackToDashboard || $[8] !== onReadOnly || $[9] !== startRouteTransition || $[10] !== t) {
    let t4;
    if ($[12] !== handleBackToDashboard || $[13] !== startRouteTransition) {
      t4 = () => {
        startRouteTransition(() => handleBackToDashboard());
      };
      $[12] = handleBackToDashboard;
      $[13] = startRouteTransition;
      $[14] = t4;
    } else {
      t4 = $[14];
    }
    let t5;
    if ($[15] !== clearRouteCache || $[16] !== closeModal || $[17] !== onReadOnly) {
      t5 = () => {
        onReadOnly();
        closeModal(modalSlug);
        clearRouteCache();
      };
      $[15] = clearRouteCache;
      $[16] = closeModal;
      $[17] = onReadOnly;
      $[18] = t5;
    } else {
      t5 = $[18];
    }
    t3 = _jsx(Modal, {
      className: baseClass,
      closeOnBlur: false,
      slug: modalSlug,
      children: _jsxs("div", {
        className: `${baseClass}__wrapper`,
        children: [_jsxs("div", {
          className: `${baseClass}__content`,
          children: [_jsx("h1", {
            children: t("general:editingTakenOver")
          }), _jsx("p", {
            children: t("general:anotherUserTakenOver")
          })]
        }), _jsxs("div", {
          className: `${baseClass}__controls`,
          children: [_jsx(Button, {
            buttonStyle: "primary",
            id: `${modalSlug}-back-to-dashboard`,
            onClick: t4,
            size: "large",
            children: t("general:backToDashboard")
          }), _jsx(Button, {
            buttonStyle: "secondary",
            id: `${modalSlug}-view-read-only`,
            onClick: t5,
            size: "large",
            children: t("general:viewReadOnly")
          })]
        })]
      })
    });
    $[5] = clearRouteCache;
    $[6] = closeModal;
    $[7] = handleBackToDashboard;
    $[8] = onReadOnly;
    $[9] = startRouteTransition;
    $[10] = t;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  return t3;
};
//# sourceMappingURL=index.js.map