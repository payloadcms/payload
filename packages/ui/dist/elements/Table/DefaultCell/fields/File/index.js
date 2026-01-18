'use client';

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getBestFitFromSizes, isImage } from 'payload/shared';
import React from 'react';
import './index.scss';
import { Thumbnail } from '../../../../Thumbnail/index.js';
const baseClass = 'file';
export const FileCell = ({
  cellData: filename,
  collectionConfig,
  field,
  rowData
}) => {
  const fieldPreviewAllowed = 'displayPreview' in field ? field.displayPreview : undefined;
  const previewAllowed = fieldPreviewAllowed ?? collectionConfig.upload?.displayPreview ?? true;
  if (previewAllowed) {
    const isFileImage = isImage(rowData?.mimeType);
    let fileSrc = isFileImage ? rowData?.thumbnailURL || rowData?.url : rowData?.thumbnailURL;
    if (isFileImage) {
      fileSrc = getBestFitFromSizes({
        sizes: rowData?.sizes,
        thumbnailURL: rowData?.thumbnailURL,
        url: rowData?.url,
        width: rowData?.width
      });
    }
    return /*#__PURE__*/_jsxs("div", {
      className: baseClass,
      children: [/*#__PURE__*/_jsx(Thumbnail, {
        className: `${baseClass}__thumbnail`,
        collectionSlug: collectionConfig?.slug,
        doc: {
          ...rowData,
          filename
        },
        fileSrc: fileSrc,
        imageCacheTag: collectionConfig?.upload?.cacheTags && rowData?.updatedAt,
        size: "small",
        uploadConfig: collectionConfig?.upload
      }), /*#__PURE__*/_jsx("span", {
        className: `${baseClass}__filename`,
        children: String(filename)
      })]
    });
  } else {
    return /*#__PURE__*/_jsx(_Fragment, {
      children: String(filename)
    });
  }
};
//# sourceMappingURL=index.js.map