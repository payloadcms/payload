'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'thumbnail';
import { File } from '../../graphics/File/index.js';
import { ShimmerEffect } from '../ShimmerEffect/index.js';
export const Thumbnail = props => {
  const $ = _c(6);
  const {
    className: t0,
    doc: t1,
    fileSrc,
    height,
    imageCacheTag,
    size,
    width
  } = props;
  const className = t0 === undefined ? "" : t0;
  const {
    filename
  } = t1 === undefined ? {} : t1;
  const [fileExists, setFileExists] = React.useState(undefined);
  const t2 = `${baseClass}--size-${size || "medium"}`;
  let t3;
  if ($[0] !== className || $[1] !== t2) {
    t3 = [baseClass, t2, className];
    $[0] = className;
    $[1] = t2;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const classNames = t3.join(" ");
  let t4;
  let t5;
  if ($[3] !== fileSrc) {
    t4 = () => {
      if (!fileSrc) {
        setFileExists(false);
        return;
      }
      setFileExists(undefined);
      const img = new Image();
      img.src = fileSrc;
      img.onload = () => {
        setFileExists(true);
      };
      img.onerror = () => {
        setFileExists(false);
      };
    };
    t5 = [fileSrc];
    $[3] = fileSrc;
    $[4] = t4;
    $[5] = t5;
  } else {
    t4 = $[4];
    t5 = $[5];
  }
  React.useEffect(t4, t5);
  let src = null;
  if (fileSrc) {
    const queryChar = fileSrc?.includes("?") ? "&" : "?";
    src = imageCacheTag ? `${fileSrc}${queryChar}${encodeURIComponent(imageCacheTag)}` : fileSrc;
  }
  return _jsxs("div", {
    className: classNames,
    children: [fileExists === undefined && _jsx(ShimmerEffect, {
      height: "100%"
    }), fileExists && _jsx("img", {
      alt: filename,
      height,
      src,
      width
    }), fileExists === false && _jsx(File, {})]
  });
};
export function ThumbnailComponent(props) {
  const $ = _c(12);
  const {
    alt,
    className: t0,
    filename,
    fileSrc,
    imageCacheTag,
    size
  } = props;
  const className = t0 === undefined ? "" : t0;
  const [fileExists, setFileExists] = React.useState(undefined);
  const t1 = `${baseClass}--size-${size || "medium"}`;
  let t2;
  if ($[0] !== className || $[1] !== t1) {
    t2 = [baseClass, t1, className];
    $[0] = className;
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const classNames = t2.join(" ");
  let t3;
  let t4;
  if ($[3] !== fileSrc) {
    t3 = () => {
      if (!fileSrc) {
        setFileExists(false);
        return;
      }
      setFileExists(undefined);
      const img = new Image();
      img.src = fileSrc;
      img.onload = () => {
        setFileExists(true);
      };
      img.onerror = () => {
        setFileExists(false);
      };
    };
    t4 = [fileSrc];
    $[3] = fileSrc;
    $[4] = t3;
    $[5] = t4;
  } else {
    t3 = $[4];
    t4 = $[5];
  }
  React.useEffect(t3, t4);
  let src = "";
  if (fileSrc) {
    const queryChar = fileSrc?.includes("?") ? "&" : "?";
    src = imageCacheTag ? `${fileSrc}${queryChar}${encodeURIComponent(imageCacheTag)}` : fileSrc;
  }
  let t5;
  if ($[6] !== alt || $[7] !== classNames || $[8] !== fileExists || $[9] !== filename || $[10] !== src) {
    t5 = _jsxs("div", {
      className: classNames,
      children: [fileExists === undefined && _jsx(ShimmerEffect, {
        height: "100%"
      }), fileExists && _jsx("img", {
        alt: alt || filename,
        src
      }), fileExists === false && _jsx(File, {})]
    });
    $[6] = alt;
    $[7] = classNames;
    $[8] = fileExists;
    $[9] = filename;
    $[10] = src;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  return t5;
}
//# sourceMappingURL=index.js.map