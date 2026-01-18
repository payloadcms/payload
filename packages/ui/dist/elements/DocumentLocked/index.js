'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { useRouteCache } from '../../providers/RouteCache/index.js';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { isClientUserObject } from '../../utilities/isClientUserObject.js';
import { Button } from '../Button/index.js';
import { Modal, useModal } from '../Modal/index.js';
import './index.scss';
const modalSlug = 'document-locked';
const baseClass = 'document-locked';
const formatDate = date => {
  if (!date) {
    return '';
  }
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
};
export const DocumentLocked = t0 => {
  const $ = _c(33);
  const {
    handleGoBack,
    isActive,
    onReadOnly,
    onTakeOver,
    updatedAt,
    user
  } = t0;
  const {
    closeModal,
    openModal
  } = useModal();
  const {
    t
  } = useTranslation();
  const {
    clearRouteCache
  } = useRouteCache();
  const {
    startRouteTransition
  } = useRouteTransition();
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
  if ($[5] !== handleGoBack || $[6] !== startRouteTransition) {
    t3 = () => {
      startRouteTransition(() => handleGoBack());
    };
    $[5] = handleGoBack;
    $[6] = startRouteTransition;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== clearRouteCache || $[9] !== closeModal || $[10] !== handleGoBack || $[11] !== onReadOnly || $[12] !== onTakeOver || $[13] !== startRouteTransition || $[14] !== t || $[15] !== t3 || $[16] !== updatedAt || $[17] !== user) {
    let t5;
    if ($[19] !== t || $[20] !== user) {
      t5 = isClientUserObject(user) ? user.email ?? user.id : `${t("general:user")}: ${user}`;
      $[19] = t;
      $[20] = user;
      $[21] = t5;
    } else {
      t5 = $[21];
    }
    let t6;
    if ($[22] !== closeModal || $[23] !== handleGoBack || $[24] !== startRouteTransition) {
      t6 = () => {
        closeModal(modalSlug);
        startRouteTransition(() => handleGoBack());
      };
      $[22] = closeModal;
      $[23] = handleGoBack;
      $[24] = startRouteTransition;
      $[25] = t6;
    } else {
      t6 = $[25];
    }
    let t7;
    if ($[26] !== clearRouteCache || $[27] !== closeModal || $[28] !== onReadOnly) {
      t7 = () => {
        onReadOnly();
        closeModal(modalSlug);
        clearRouteCache();
      };
      $[26] = clearRouteCache;
      $[27] = closeModal;
      $[28] = onReadOnly;
      $[29] = t7;
    } else {
      t7 = $[29];
    }
    let t8;
    if ($[30] !== closeModal || $[31] !== onTakeOver) {
      t8 = () => {
        onTakeOver();
        closeModal(modalSlug);
      };
      $[30] = closeModal;
      $[31] = onTakeOver;
      $[32] = t8;
    } else {
      t8 = $[32];
    }
    t4 = _jsx(Modal, {
      className: baseClass,
      closeOnBlur: false,
      onClose: t3,
      slug: modalSlug,
      children: _jsxs("div", {
        className: `${baseClass}__wrapper`,
        children: [_jsxs("div", {
          className: `${baseClass}__content`,
          children: [_jsx("h1", {
            children: t("general:documentLocked")
          }), _jsxs("p", {
            children: [_jsx("strong", {
              children: t5
            }), " ", t("general:currentlyEditing")]
          }), _jsxs("p", {
            children: [t("general:editedSince"), " ", _jsx("strong", {
              children: formatDate(updatedAt)
            })]
          })]
        }), _jsxs("div", {
          className: `${baseClass}__controls`,
          children: [_jsx(Button, {
            buttonStyle: "secondary",
            id: `${modalSlug}-go-back`,
            onClick: t6,
            size: "large",
            children: t("general:goBack")
          }), _jsx(Button, {
            buttonStyle: "secondary",
            id: `${modalSlug}-view-read-only`,
            onClick: t7,
            size: "large",
            children: t("general:viewReadOnly")
          }), _jsx(Button, {
            buttonStyle: "primary",
            id: `${modalSlug}-take-over`,
            onClick: t8,
            size: "large",
            children: t("general:takeOver")
          })]
        })]
      })
    });
    $[8] = clearRouteCache;
    $[9] = closeModal;
    $[10] = handleGoBack;
    $[11] = onReadOnly;
    $[12] = onTakeOver;
    $[13] = startRouteTransition;
    $[14] = t;
    $[15] = t3;
    $[16] = updatedAt;
    $[17] = user;
    $[18] = t4;
  } else {
    t4 = $[18];
  }
  return t4;
};
//# sourceMappingURL=index.js.map