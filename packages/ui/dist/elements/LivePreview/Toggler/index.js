import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { EyeIcon } from '../../../icons/Eye/index.js';
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'live-preview-toggler';
export const LivePreviewToggler = () => {
  const {
    isLivePreviewing,
    setIsLivePreviewing,
    url: livePreviewURL
  } = useLivePreviewContext();
  const {
    t
  } = useTranslation();
  if (!livePreviewURL) {
    return null;
  }
  return /*#__PURE__*/_jsx("button", {
    "aria-label": isLivePreviewing ? t('general:exitLivePreview') : t('general:livePreview'),
    className: [baseClass, isLivePreviewing && `${baseClass}--active`].filter(Boolean).join(' '),
    id: "live-preview-toggler",
    onClick: () => {
      setIsLivePreviewing(!isLivePreviewing);
    },
    title: isLivePreviewing ? t('general:exitLivePreview') : t('general:livePreview'),
    type: "button",
    children: /*#__PURE__*/_jsx(EyeIcon, {
      active: isLivePreviewing
    })
  });
};
//# sourceMappingURL=index.js.map