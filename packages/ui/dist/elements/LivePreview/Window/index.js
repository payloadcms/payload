'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { reduceFieldsToValues } from 'payload/shared';
import React, { useEffect } from 'react';
import { useAllFormFields } from '../../../forms/Form/context.js';
import { useDocumentEvents } from '../../../providers/DocumentEvents/index.js';
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js';
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js';
import { useLocale } from '../../../providers/Locale/index.js';
import { ShimmerEffect } from '../../ShimmerEffect/index.js';
import { DeviceContainer } from '../Device/index.js';
import { IFrame } from '../IFrame/index.js';
import { LivePreviewToolbar } from '../Toolbar/index.js';
import './index.scss';
const baseClass = 'live-preview-window';
export const LivePreviewWindow = props => {
  const $ = _c(49);
  const {
    appIsReady,
    breakpoint,
    iframeRef,
    isLivePreviewing,
    loadedURL,
    popupRef,
    previewWindowType,
    url
  } = useLivePreviewContext();
  const locale = useLocale();
  const {
    mostRecentUpdate
  } = useDocumentEvents();
  const [formState] = useAllFormFields();
  const {
    id,
    collectionSlug,
    globalSlug
  } = useDocumentInfo();
  let t0;
  if ($[0] !== appIsReady || $[1] !== collectionSlug || $[2] !== formState || $[3] !== globalSlug || $[4] !== id || $[5] !== iframeRef || $[6] !== isLivePreviewing || $[7] !== locale || $[8] !== mostRecentUpdate || $[9] !== popupRef || $[10] !== previewWindowType || $[11] !== url) {
    t0 = () => {
      if (!isLivePreviewing || !appIsReady) {
        return;
      }
      if (formState) {
        const values = reduceFieldsToValues(formState, true);
        if (!values.id) {
          values.id = id;
        }
        const message = {
          type: "payload-live-preview",
          collectionSlug,
          data: values,
          externallyUpdatedRelationship: mostRecentUpdate,
          globalSlug,
          locale: locale.code
        };
        if (previewWindowType === "popup" && popupRef.current) {
          popupRef.current.postMessage(message, url);
        }
        if (previewWindowType === "iframe" && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(message, url);
        }
      }
    };
    $[0] = appIsReady;
    $[1] = collectionSlug;
    $[2] = formState;
    $[3] = globalSlug;
    $[4] = id;
    $[5] = iframeRef;
    $[6] = isLivePreviewing;
    $[7] = locale;
    $[8] = mostRecentUpdate;
    $[9] = popupRef;
    $[10] = previewWindowType;
    $[11] = url;
    $[12] = t0;
  } else {
    t0 = $[12];
  }
  let t1;
  if ($[13] !== appIsReady || $[14] !== collectionSlug || $[15] !== formState || $[16] !== globalSlug || $[17] !== id || $[18] !== iframeRef || $[19] !== isLivePreviewing || $[20] !== loadedURL || $[21] !== locale || $[22] !== mostRecentUpdate || $[23] !== popupRef || $[24] !== previewWindowType || $[25] !== url) {
    t1 = [formState, url, collectionSlug, globalSlug, id, previewWindowType, popupRef, appIsReady, iframeRef, mostRecentUpdate, locale, isLivePreviewing, loadedURL];
    $[13] = appIsReady;
    $[14] = collectionSlug;
    $[15] = formState;
    $[16] = globalSlug;
    $[17] = id;
    $[18] = iframeRef;
    $[19] = isLivePreviewing;
    $[20] = loadedURL;
    $[21] = locale;
    $[22] = mostRecentUpdate;
    $[23] = popupRef;
    $[24] = previewWindowType;
    $[25] = url;
    $[26] = t1;
  } else {
    t1 = $[26];
  }
  useEffect(t0, t1);
  let t2;
  if ($[27] !== appIsReady || $[28] !== iframeRef || $[29] !== isLivePreviewing || $[30] !== popupRef || $[31] !== previewWindowType || $[32] !== url) {
    t2 = () => {
      if (!isLivePreviewing || !appIsReady) {
        return;
      }
      const message_0 = {
        type: "payload-document-event"
      };
      if (previewWindowType === "popup" && popupRef.current) {
        popupRef.current.postMessage(message_0, url);
      }
      if (previewWindowType === "iframe" && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(message_0, url);
      }
    };
    $[27] = appIsReady;
    $[28] = iframeRef;
    $[29] = isLivePreviewing;
    $[30] = popupRef;
    $[31] = previewWindowType;
    $[32] = url;
    $[33] = t2;
  } else {
    t2 = $[33];
  }
  let t3;
  if ($[34] !== appIsReady || $[35] !== iframeRef || $[36] !== isLivePreviewing || $[37] !== mostRecentUpdate || $[38] !== popupRef || $[39] !== previewWindowType || $[40] !== url) {
    t3 = [mostRecentUpdate, iframeRef, popupRef, previewWindowType, url, isLivePreviewing, appIsReady];
    $[34] = appIsReady;
    $[35] = iframeRef;
    $[36] = isLivePreviewing;
    $[37] = mostRecentUpdate;
    $[38] = popupRef;
    $[39] = previewWindowType;
    $[40] = url;
    $[41] = t3;
  } else {
    t3 = $[41];
  }
  useEffect(t2, t3);
  if (previewWindowType !== "iframe") {
    return null;
  }
  const t4 = isLivePreviewing && `${baseClass}--is-live-previewing`;
  const t5 = breakpoint && breakpoint !== "responsive" && `${baseClass}--has-breakpoint`;
  let t6;
  if ($[42] !== t4 || $[43] !== t5) {
    t6 = [baseClass, t4, t5].filter(Boolean);
    $[42] = t4;
    $[43] = t5;
    $[44] = t6;
  } else {
    t6 = $[44];
  }
  const t7 = t6.join(" ");
  let t8;
  if ($[45] !== props || $[46] !== t7 || $[47] !== url) {
    t8 = _jsx("div", {
      className: t7,
      children: _jsxs("div", {
        className: `${baseClass}__wrapper`,
        children: [_jsx(LivePreviewToolbar, {
          ...props
        }), _jsx("div", {
          className: `${baseClass}__main`,
          children: _jsx(DeviceContainer, {
            children: url ? _jsx(IFrame, {}) : _jsx(ShimmerEffect, {
              height: "100%"
            })
          })
        })]
      })
    });
    $[45] = props;
    $[46] = t7;
    $[47] = url;
    $[48] = t8;
  } else {
    t8 = $[48];
  }
  return t8;
};
//# sourceMappingURL=index.js.map