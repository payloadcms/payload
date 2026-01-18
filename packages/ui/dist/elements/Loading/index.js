'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useLoadingOverlay } from '../../elements/LoadingOverlay/index.js';
import { useFormProcessing } from '../../forms/Form/context.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'loading-overlay';
export const LoadingOverlay = t0 => {
  const $ = _c(8);
  const {
    animationDuration,
    loadingText,
    overlayType,
    show: t1
  } = t0;
  const show = t1 === undefined ? true : t1;
  const {
    t
  } = useTranslation();
  const t2 = show ? `${baseClass}--entering` : `${baseClass}--exiting`;
  const t3 = overlayType ? `${baseClass}--${overlayType}` : "";
  let t4;
  if ($[0] !== t2 || $[1] !== t3) {
    t4 = [baseClass, t2, t3].filter(Boolean);
    $[0] = t2;
    $[1] = t3;
    $[2] = t4;
  } else {
    t4 = $[2];
  }
  const t5 = t4.join(" ");
  const t6 = animationDuration || "500ms";
  let t7;
  if ($[3] !== loadingText || $[4] !== t || $[5] !== t5 || $[6] !== t6) {
    t7 = _jsxs("div", {
      className: t5,
      style: {
        animationDuration: t6
      },
      children: [_jsxs("div", {
        className: `${baseClass}__bars`,
        children: [_jsx("div", {
          className: `${baseClass}__bar`
        }), _jsx("div", {
          className: `${baseClass}__bar`
        }), _jsx("div", {
          className: `${baseClass}__bar`
        }), _jsx("div", {
          className: `${baseClass}__bar`
        }), _jsx("div", {
          className: `${baseClass}__bar`
        })]
      }), _jsx("span", {
        className: `${baseClass}__text`,
        children: loadingText || t("general:loading")
      })]
    });
    $[3] = loadingText;
    $[4] = t;
    $[5] = t5;
    $[6] = t6;
    $[7] = t7;
  } else {
    t7 = $[7];
  }
  return t7;
};
export const LoadingOverlayToggle = t0 => {
  const $ = _c(7);
  const {
    name: key,
    type: t1,
    loadingText,
    show
  } = t0;
  const type = t1 === undefined ? "fullscreen" : t1;
  const {
    toggleLoadingOverlay
  } = useLoadingOverlay();
  let t2;
  let t3;
  if ($[0] !== key || $[1] !== loadingText || $[2] !== show || $[3] !== toggleLoadingOverlay || $[4] !== type) {
    t2 = () => {
      toggleLoadingOverlay({
        type,
        isLoading: show,
        key,
        loadingText: loadingText || undefined
      });
      return () => {
        toggleLoadingOverlay({
          type,
          isLoading: false,
          key
        });
      };
    };
    t3 = [show, toggleLoadingOverlay, key, type, loadingText];
    $[0] = key;
    $[1] = loadingText;
    $[2] = show;
    $[3] = toggleLoadingOverlay;
    $[4] = type;
    $[5] = t2;
    $[6] = t3;
  } else {
    t2 = $[5];
    t3 = $[6];
  }
  React.useEffect(t2, t3);
  return null;
};
export const FormLoadingOverlayToggle = t0 => {
  const $ = _c(6);
  const {
    name,
    type: t1,
    action,
    formIsLoading: t2,
    loadingSuffix
  } = t0;
  const type = t1 === undefined ? "fullscreen" : t1;
  const formIsLoading = t2 === undefined ? false : t2;
  const isProcessing = useFormProcessing();
  const {
    i18n,
    t
  } = useTranslation();
  const labels = {
    create: t("general:creating"),
    loading: t("general:loading"),
    update: t("general:updating")
  };
  const t3 = `${labels[action]} ${loadingSuffix ? getTranslation(loadingSuffix, i18n) : ""}`;
  let t4;
  if ($[0] !== formIsLoading || $[1] !== isProcessing || $[2] !== name || $[3] !== t3 || $[4] !== type) {
    t4 = _jsx(LoadingOverlayToggle, {
      loadingText: t3.trim(),
      name,
      show: formIsLoading || isProcessing,
      type
    });
    $[0] = formIsLoading;
    $[1] = isProcessing;
    $[2] = name;
    $[3] = t3;
    $[4] = type;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
};
//# sourceMappingURL=index.js.map