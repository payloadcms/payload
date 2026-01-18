'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { ExternalLinkIcon } from '../../icons/ExternalLink/index.js';
import './index.scss';
import { usePreviewURL } from '../../providers/LivePreview/context.js';
import { useTranslation } from '../../providers/Translation/index.js';
const baseClass = 'preview-btn';
export function PreviewButton(props) {
  const $ = _c(3);
  const {
    previewURL
  } = usePreviewURL();
  const {
    t
  } = useTranslation();
  if (!previewURL) {
    return null;
  }
  let t0;
  if ($[0] !== previewURL || $[1] !== t) {
    t0 = _jsx("a", {
      "aria-label": t("version:preview"),
      className: baseClass,
      href: previewURL,
      id: "preview-button",
      target: "_blank",
      title: t("version:preview"),
      children: _jsx(ExternalLinkIcon, {})
    });
    $[0] = previewURL;
    $[1] = t;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}
//# sourceMappingURL=index.js.map