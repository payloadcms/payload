'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { Link, useConfig, useTranslation } from '@payloadcms/ui';
import { formatDate } from '@payloadcms/ui/shared';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
export const CreatedAtCell = t0 => {
  const {
    collectionSlug,
    docID,
    globalSlug,
    isTrashed,
    rowData: t1
  } = t0;
  const {
    id,
    updatedAt
  } = t1 === undefined ? {} : t1;
  const {
    config: t2
  } = useConfig();
  const {
    admin: t3,
    routes: t4
  } = t2;
  const {
    dateFormat
  } = t3;
  const {
    admin: adminRoute
  } = t4;
  const {
    i18n
  } = useTranslation();
  const trashedDocPrefix = isTrashed ? "trash/" : "";
  let to;
  if (collectionSlug) {
    to = formatAdminURL({
      adminRoute,
      path: `/collections/${collectionSlug}/${trashedDocPrefix}${docID}/versions/${id}`
    });
  }
  if (globalSlug) {
    to = formatAdminURL({
      adminRoute,
      path: `/globals/${globalSlug}/versions/${id}`
    });
  }
  return _jsx(Link, {
    href: to,
    prefetch: false,
    children: formatDate({
      date: updatedAt,
      i18n,
      pattern: dateFormat
    })
  });
};
//# sourceMappingURL=index.js.map