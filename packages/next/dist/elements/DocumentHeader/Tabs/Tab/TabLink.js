'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { Button } from '@payloadcms/ui';
import { useParams, usePathname, useSearchParams } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
export const DocumentTabLink = t0 => {
  const $ = _c(13);
  const {
    adminRoute,
    ariaLabel,
    baseClass,
    children,
    href: hrefFromProps,
    isActive: isActiveFromProps,
    newTab
  } = t0;
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = searchParams.get("locale");
  const [entityType, entitySlug, segmentThree, segmentFour] = params.segments || [];
  const isCollection = entityType === "collections";
  const t1 = `/${isCollection ? "collections" : "globals"}/${entitySlug}`;
  let t2;
  if ($[0] !== adminRoute || $[1] !== t1) {
    t2 = formatAdminURL({
      adminRoute,
      path: t1
    });
    $[0] = adminRoute;
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let docPath = t2;
  if (isCollection) {
    if (segmentThree === "trash" && segmentFour) {
      docPath = docPath + `/trash/${segmentFour}`;
    } else {
      if (segmentThree) {
        docPath = docPath + `/${segmentThree}`;
      }
    }
  }
  const href = `${docPath}${hrefFromProps}`;
  const hrefWithLocale = `${href}${locale ? `?locale=${locale}` : ""}`;
  let t3;
  if ($[3] !== ariaLabel || $[4] !== baseClass || $[5] !== children || $[6] !== docPath || $[7] !== href || $[8] !== hrefWithLocale || $[9] !== isActiveFromProps || $[10] !== newTab || $[11] !== pathname) {
    const isActive = href === docPath && pathname === docPath || href !== docPath && pathname.startsWith(href) || isActiveFromProps;
    t3 = _jsx(Button, {
      "aria-label": ariaLabel,
      buttonStyle: "tab",
      className: [baseClass, isActive && `${baseClass}--active`].filter(Boolean).join(" "),
      disabled: isActive,
      el: !isActive || href !== pathname ? "link" : "div",
      margin: false,
      newTab,
      size: "medium",
      to: !isActive || href !== pathname ? hrefWithLocale : undefined,
      children
    });
    $[3] = ariaLabel;
    $[4] = baseClass;
    $[5] = children;
    $[6] = docPath;
    $[7] = href;
    $[8] = hrefWithLocale;
    $[9] = isActiveFromProps;
    $[10] = newTab;
    $[11] = pathname;
    $[12] = t3;
  } else {
    t3 = $[12];
  }
  return t3;
};
//# sourceMappingURL=TabLink.js.map