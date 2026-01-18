'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useAuth } from '../../../providers/Auth/index.js';
import { EditDepthProvider } from '../../../providers/EditDepth/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Drawer, DrawerToggler } from '../../Drawer/index.js';
import { useFormsManager } from '../FormsManager/index.js';
import { EditManyBulkUploadsDrawerContent } from './DrawerContent.js';
import './index.scss';
export const baseClass = 'edit-many-bulk-uploads';
export const EditManyBulkUploads = props => {
  const $ = _c(5);
  const {
    collection: t0,
    collection
  } = props;
  const {
    slug
  } = t0 === undefined ? {} : t0;
  const {
    permissions
  } = useAuth();
  const {
    t
  } = useTranslation();
  const {
    forms
  } = useFormsManager();
  const collectionPermissions = permissions?.collections?.[slug];
  const hasUpdatePermission = collectionPermissions?.update;
  const drawerSlug = `edit-${slug}-bulk-uploads`;
  if (!hasUpdatePermission) {
    return null;
  }
  let t1;
  if ($[0] !== collection || $[1] !== drawerSlug || $[2] !== forms || $[3] !== t) {
    t1 = _jsxs("div", {
      className: baseClass,
      children: [_jsx(DrawerToggler, {
        "aria-label": t("general:editAll"),
        className: `${baseClass}__toggle`,
        slug: drawerSlug,
        children: t("general:editAll")
      }), _jsx(EditDepthProvider, {
        children: _jsx(Drawer, {
          Header: null,
          slug: drawerSlug,
          children: _jsx(EditManyBulkUploadsDrawerContent, {
            collection,
            drawerSlug,
            forms
          })
        })
      })]
    });
    $[0] = collection;
    $[1] = drawerSlug;
    $[2] = forms;
    $[3] = t;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
};
//# sourceMappingURL=index.js.map