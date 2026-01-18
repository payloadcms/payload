'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { getBestFitFromSizes, isImage } from 'payload/shared';
import React from 'react';
import './index.scss';
import { RelationshipContent } from '../RelationshipContent/index.js';
import { UploadCard } from '../UploadCard/index.js';
const baseClass = 'upload upload--has-one';
export function UploadComponentHasOne(props) {
  const {
    className,
    displayPreview,
    fileDoc,
    onRemove,
    readonly,
    reloadDoc,
    serverURL,
    showCollectionSlug = false
  } = props;
  const {
    relationTo,
    value
  } = fileDoc;
  const id = String(value?.id);
  let src;
  let thumbnailSrc;
  if (value.url) {
    try {
      src = new URL(value.url, serverURL).toString();
    } catch {
      src = `${serverURL}${value.url}`;
    }
  }
  if (value.thumbnailURL) {
    try {
      thumbnailSrc = new URL(value.thumbnailURL, serverURL).toString();
    } catch {
      thumbnailSrc = `${serverURL}${value.thumbnailURL}`;
    }
  }
  if (isImage(value.mimeType)) {
    thumbnailSrc = getBestFitFromSizes({
      sizes: value.sizes,
      thumbnailURL: thumbnailSrc,
      url: src,
      width: value.width
    });
  }
  return /*#__PURE__*/_jsx(UploadCard, {
    className: [baseClass, className].filter(Boolean).join(' '),
    children: /*#__PURE__*/_jsx(RelationshipContent, {
      allowEdit: !readonly,
      allowRemove: !readonly,
      alt: value?.alt || value?.filename,
      byteSize: value.filesize,
      collectionSlug: relationTo,
      displayPreview: displayPreview,
      filename: value.filename,
      id: id,
      mimeType: value?.mimeType,
      onRemove: onRemove,
      reloadDoc: reloadDoc,
      showCollectionSlug: showCollectionSlug,
      src: src,
      thumbnailSrc: thumbnailSrc,
      updatedAt: value.updatedAt,
      x: value?.width,
      y: value?.height
    })
  });
}
//# sourceMappingURL=index.js.map