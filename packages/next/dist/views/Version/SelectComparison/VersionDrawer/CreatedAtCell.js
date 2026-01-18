'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useConfig, useModal, useRouteTransition, useTranslation } from '@payloadcms/ui';
import { formatDate } from '@payloadcms/ui/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js';
export const VersionDrawerCreatedAtCell = t0 => {
  const {
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
    admin: t3
  } = t2;
  const {
    dateFormat
  } = t3;
  const {
    closeAllModals
  } = useModal();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    startRouteTransition
  } = useRouteTransition();
  const {
    i18n
  } = useTranslation();
  return _jsx("button", {
    className: "created-at-cell",
    onClick: () => {
      closeAllModals();
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (id) {
        current.set("versionFrom", String(id));
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";
      startRouteTransition(() => router.push(`${pathname}${query}`));
    },
    type: "button",
    children: formatDate({
      date: updatedAt,
      i18n,
      pattern: dateFormat
    })
  });
};
//# sourceMappingURL=CreatedAtCell.js.map