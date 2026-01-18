'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js';
import './index.scss';
const baseClass = 'live-preview-iframe';
export const IFrame = () => {
  const $ = _c(8);
  const {
    iframeRef,
    setLoadedURL,
    url,
    zoom
  } = useLivePreviewContext();
  let t0;
  if ($[0] !== setLoadedURL || $[1] !== url) {
    t0 = () => {
      setLoadedURL(url);
    };
    $[0] = setLoadedURL;
    $[1] = url;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const t1 = typeof zoom === "number" ? `scale(${zoom}) ` : undefined;
  let t2;
  if ($[3] !== iframeRef || $[4] !== t0 || $[5] !== t1 || $[6] !== url) {
    t2 = _jsx("iframe", {
      className: baseClass,
      onLoad: t0,
      ref: iframeRef,
      src: url,
      style: {
        transform: t1
      },
      title: url
    }, url);
    $[3] = iframeRef;
    $[4] = t0;
    $[5] = t1;
    $[6] = url;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
};
//# sourceMappingURL=index.js.map