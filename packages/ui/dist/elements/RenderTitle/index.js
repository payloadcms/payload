'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { Fragment } from 'react';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useDocumentTitle } from '../../providers/DocumentTitle/index.js';
import { IDLabel } from '../IDLabel/index.js';
import './index.scss';
const baseClass = 'render-title';
export const RenderTitle = props => {
  const $ = _c(10);
  const {
    className,
    element: t0,
    fallback,
    title: titleFromProps
  } = props;
  const element = t0 === undefined ? "h1" : t0;
  const {
    id,
    isInitializing
  } = useDocumentInfo();
  const {
    title: titleFromContext
  } = useDocumentTitle();
  const title = titleFromProps || titleFromContext || fallback;
  const idAsTitle = title === id;
  const Tag = element;
  let t1;
  if ($[0] !== Tag || $[1] !== className || $[2] !== id || $[3] !== idAsTitle || $[4] !== isInitializing || $[5] !== title) {
    const EmptySpace = _jsx(Fragment, {
      children: "\xA0"
    });
    const t2 = idAsTitle && `${baseClass}--has-id`;
    let t3;
    if ($[7] !== className || $[8] !== t2) {
      t3 = [className, baseClass, t2].filter(Boolean);
      $[7] = className;
      $[8] = t2;
      $[9] = t3;
    } else {
      t3 = $[9];
    }
    t1 = _jsx(Tag, {
      className: t3.join(" "),
      "data-doc-id": id,
      title,
      children: isInitializing ? EmptySpace : _jsx(Fragment, {
        children: idAsTitle ? _jsx(IDLabel, {
          className: `${baseClass}__id`,
          id
        }) : title || EmptySpace
      })
    });
    $[0] = Tag;
    $[1] = className;
    $[2] = id;
    $[3] = idAsTitle;
    $[4] = isInitializing;
    $[5] = title;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
};
//# sourceMappingURL=index.js.map