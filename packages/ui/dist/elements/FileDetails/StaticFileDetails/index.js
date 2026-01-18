'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Button } from '../../Button/index.js';
import { Thumbnail } from '../../Thumbnail/index.js';
import { UploadActions } from '../../Upload/index.js';
import { FileMeta } from '../FileMeta/index.js';
import './index.scss';
const baseClass = 'file-details';
export const StaticFileDetails = props => {
  const {
    customUploadActions,
    doc,
    enableAdjustments,
    handleRemove,
    hasImageSizes,
    hideRemoveFile,
    imageCacheTag,
    uploadConfig
  } = props;
  const {
    filename,
    filesize,
    height,
    mimeType,
    thumbnailURL,
    url,
    width
  } = doc;
  const previewAllowed = uploadConfig.displayPreview ?? true;
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsxs("header", {
      children: [previewAllowed && /*#__PURE__*/_jsx(Thumbnail, {
        // size="small"
        className: `${baseClass}__thumbnail`,
        doc: doc,
        fileSrc: thumbnailURL || url,
        imageCacheTag: imageCacheTag,
        uploadConfig: uploadConfig
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__main-detail`,
        children: [/*#__PURE__*/_jsx(FileMeta, {
          filename: filename,
          filesize: filesize,
          height: height,
          mimeType: mimeType,
          url: url,
          width: width
        }), (enableAdjustments || hasImageSizes && doc.filename || customUploadActions) && /*#__PURE__*/_jsx(UploadActions, {
          customActions: customUploadActions,
          enableAdjustments: Boolean(enableAdjustments),
          enablePreviewSizes: hasImageSizes && doc.filename,
          mimeType: mimeType
        })]
      }), !hideRemoveFile && handleRemove && /*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__remove`,
        icon: "x",
        iconStyle: "with-border",
        onClick: handleRemove,
        round: true
      })]
    })
  });
};
//# sourceMappingURL=index.js.map