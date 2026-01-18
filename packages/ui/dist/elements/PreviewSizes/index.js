'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { FileMeta } from '../FileDetails/FileMeta/index.js';
import './index.scss';
const baseClass = 'preview-sizes';
const sortSizes = (sizes, imageSizes) => {
  if (!imageSizes || imageSizes.length === 0) {
    return sizes;
  }
  const orderedSizes = {};
  imageSizes.forEach(({
    name
  }) => {
    if (sizes[name]) {
      orderedSizes[name] = sizes[name];
    }
  });
  return orderedSizes;
};
const PreviewSizeCard = ({
  name,
  active,
  alt,
  meta,
  onClick,
  previewSrc
}) => {
  return /*#__PURE__*/_jsxs("div", {
    className: [`${baseClass}__sizeOption`, active && `${baseClass}--selected`].filter(Boolean).join(' '),
    onClick: typeof onClick === 'function' ? onClick : undefined,
    onKeyDown: e => {
      if (typeof onClick !== 'function') {
        return;
      }
      if (e.key === 'Enter') {
        onClick();
      }
    },
    role: "button",
    tabIndex: 0,
    children: [/*#__PURE__*/_jsx("div", {
      className: `${baseClass}__image`,
      children: /*#__PURE__*/_jsx("img", {
        alt: alt,
        src: previewSrc
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__sizeMeta`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__sizeName`,
        children: name
      }), /*#__PURE__*/_jsx(FileMeta, {
        ...meta
      })]
    })]
  });
};
export const PreviewSizes = ({
  doc,
  imageCacheTag,
  uploadConfig
}) => {
  const {
    imageSizes
  } = uploadConfig;
  const {
    sizes
  } = doc;
  const alt = doc?.alt || doc.filename || '';
  const [orderedSizes, setOrderedSizes] = useState(() => sortSizes(sizes, imageSizes));
  const [selectedSize, setSelectedSize] = useState(null);
  const generateImageUrl = doc_0 => {
    if (!doc_0.filename) {
      return null;
    }
    if (doc_0.url) {
      return `${doc_0.url}${imageCacheTag ? `?${encodeURIComponent(imageCacheTag)}` : ''}`;
    }
  };
  useEffect(() => {
    setOrderedSizes(sortSizes(sizes, imageSizes));
  }, [sizes, imageSizes, imageCacheTag]);
  const mainPreviewSrc = selectedSize ? generateImageUrl(doc.sizes[selectedSize]) : generateImageUrl(doc);
  const originalImage = useMemo(() => ({
    filename: doc.filename,
    filesize: doc.filesize,
    height: doc.height,
    mimeType: doc.mimeType,
    url: doc.url,
    width: doc.width
  }), [doc]);
  const originalFilename = 'Original';
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__imageWrap`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__meta`,
        children: [/*#__PURE__*/_jsx("div", {
          className: `${baseClass}__sizeName`,
          children: selectedSize || originalFilename
        }), /*#__PURE__*/_jsx(FileMeta, {
          ...(selectedSize ? orderedSizes[selectedSize] : originalImage)
        })]
      }), /*#__PURE__*/_jsx("img", {
        alt: alt,
        className: `${baseClass}__preview`,
        src: mainPreviewSrc
      })]
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__listWrap`,
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__list`,
        children: [/*#__PURE__*/_jsx(PreviewSizeCard, {
          active: !selectedSize,
          alt: alt,
          meta: originalImage,
          name: originalFilename,
          onClick: () => setSelectedSize(null),
          previewSrc: generateImageUrl(doc)
        }), Object.entries(orderedSizes).map(([key, val]) => {
          const selected = selectedSize === key;
          const previewSrc = generateImageUrl(val);
          if (previewSrc) {
            return /*#__PURE__*/_jsx(PreviewSizeCard, {
              active: selected,
              alt: alt,
              meta: val,
              name: key,
              onClick: () => setSelectedSize(key),
              previewSrc: previewSrc
            }, key);
          }
          return null;
        })]
      })
    })]
  });
};
//# sourceMappingURL=index.js.map