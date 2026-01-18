'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
import { Link } from '../../elements/Link/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { formatAdminURL } from '../../utilities/formatAdminURL.js';
import { sanitizeID } from '../../utilities/sanitizeID.js';
import { useDrawerDepth } from '../Drawer/index.js';
const baseClass = 'id-label';
export const IDLabel = t0 => {
  const $ = _c(9);
  const {
    id,
    className,
    prefix: t1
  } = t0;
  const prefix = t1 === undefined ? "ID:" : t1;
  const {
    config: t2
  } = useConfig();
  const {
    routes: t3
  } = t2;
  const {
    admin: adminRoute
  } = t3;
  const {
    collectionSlug,
    globalSlug
  } = useDocumentInfo();
  const drawerDepth = useDrawerDepth();
  const t4 = `/${collectionSlug ? `collections/${collectionSlug}` : `globals/${globalSlug}`}/${id}`;
  let t5;
  if ($[0] !== adminRoute || $[1] !== className || $[2] !== drawerDepth || $[3] !== id || $[4] !== prefix || $[5] !== t4) {
    const docPath = formatAdminURL({
      adminRoute,
      path: t4
    });
    let t6;
    if ($[7] !== className) {
      t6 = [baseClass, className].filter(Boolean);
      $[7] = className;
      $[8] = t6;
    } else {
      t6 = $[8];
    }
    t5 = _jsxs("div", {
      className: t6.join(" "),
      title: id,
      children: [prefix, "\xA0", drawerDepth > 1 ? _jsx(Link, {
        href: docPath,
        children: sanitizeID(id)
      }) : sanitizeID(id)]
    });
    $[0] = adminRoute;
    $[1] = className;
    $[2] = drawerDepth;
    $[3] = id;
    $[4] = prefix;
    $[5] = t4;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  return t5;
};
//# sourceMappingURL=index.js.map