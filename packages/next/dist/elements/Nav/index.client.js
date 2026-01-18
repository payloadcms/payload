'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { BrowseByFolderButton, Link, NavGroup, useConfig, useTranslation } from '@payloadcms/ui';
import { EntityType } from '@payloadcms/ui/shared';
import { usePathname } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React, { Fragment } from 'react';
const baseClass = 'nav';
/**
 * @internal
 */
export const DefaultNavClient = t0 => {
  const $ = _c(13);
  const {
    groups,
    navPreferences
  } = t0;
  const pathname = usePathname();
  const {
    config: t1
  } = useConfig();
  const {
    admin: t2,
    folders,
    routes: t3
  } = t1;
  const {
    routes: t4
  } = t2;
  const {
    browseByFolder: foldersRoute
  } = t4;
  const {
    admin: adminRoute
  } = t3;
  const {
    i18n
  } = useTranslation();
  let t5;
  if ($[0] !== adminRoute || $[1] !== folders || $[2] !== foldersRoute || $[3] !== groups || $[4] !== i18n || $[5] !== navPreferences?.groups || $[6] !== pathname) {
    const folderURL = formatAdminURL({
      adminRoute,
      path: foldersRoute
    });
    const viewingRootFolderView = pathname.startsWith(folderURL);
    let t6;
    if ($[8] !== adminRoute || $[9] !== i18n || $[10] !== navPreferences?.groups || $[11] !== pathname) {
      t6 = (t7, key) => {
        const {
          entities,
          label
        } = t7;
        return _jsx(NavGroup, {
          isOpen: navPreferences?.groups?.[label]?.open,
          label,
          children: entities.map((t8, i) => {
            const {
              slug,
              type,
              label: label_0
            } = t8;
            let href;
            let id;
            if (type === EntityType.collection) {
              href = formatAdminURL({
                adminRoute,
                path: `/collections/${slug}`
              });
              id = `nav-${slug}`;
            }
            if (type === EntityType.global) {
              href = formatAdminURL({
                adminRoute,
                path: `/globals/${slug}`
              });
              id = `nav-global-${slug}`;
            }
            const isActive = pathname.startsWith(href) && ["/", undefined].includes(pathname[href.length]);
            const Label = _jsxs(_Fragment, {
              children: [isActive && _jsx("div", {
                className: `${baseClass}__link-indicator`
              }), _jsx("span", {
                className: `${baseClass}__link-label`,
                children: getTranslation(label_0, i18n)
              })]
            });
            if (pathname === href) {
              return _jsx("div", {
                className: `${baseClass}__link`,
                id,
                children: Label
              }, i);
            }
            return _jsx(Link, {
              className: `${baseClass}__link`,
              href,
              id,
              prefetch: false,
              children: Label
            }, i);
          })
        }, key);
      };
      $[8] = adminRoute;
      $[9] = i18n;
      $[10] = navPreferences?.groups;
      $[11] = pathname;
      $[12] = t6;
    } else {
      t6 = $[12];
    }
    t5 = _jsxs(Fragment, {
      children: [folders && folders.browseByFolder && _jsx(BrowseByFolderButton, {
        active: viewingRootFolderView
      }), groups.map(t6)]
    });
    $[0] = adminRoute;
    $[1] = folders;
    $[2] = foldersRoute;
    $[3] = groups;
    $[4] = i18n;
    $[5] = navPreferences?.groups;
    $[6] = pathname;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  return t5;
};
//# sourceMappingURL=index.client.js.map