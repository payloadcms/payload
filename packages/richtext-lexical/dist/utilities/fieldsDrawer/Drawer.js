'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { Drawer, EditDepthProvider, useModal } from '@payloadcms/ui';
import React from 'react';
import { DrawerContent } from './DrawerContent.js';
/**
 * This FieldsDrawer component can be used to easily create a Drawer that contains a form with fields within your feature.
 * The fields are taken directly from the schema map based on your `featureKey` and `schemaPathSuffix`. Thus, this can only
 * be used if you provide your field schema inside the `generateSchemaMap` prop of your feature.server.ts.
 */
export const FieldsDrawer = t0 => {
  const $ = _c(15);
  const {
    className,
    data,
    drawerSlug,
    drawerTitle,
    featureKey,
    fieldMapOverride,
    handleDrawerSubmit,
    schemaFieldsPathOverride,
    schemaPath,
    schemaPathSuffix
  } = t0;
  const {
    closeModal
  } = useModal();
  const t1 = drawerTitle ?? "";
  let t2;
  if ($[0] !== closeModal || $[1] !== drawerSlug || $[2] !== handleDrawerSubmit) {
    t2 = (args, args2) => {
      closeModal(drawerSlug);
      setTimeout(() => {
        handleDrawerSubmit(args, args2);
      }, 1);
    };
    $[0] = closeModal;
    $[1] = drawerSlug;
    $[2] = handleDrawerSubmit;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== className || $[5] !== data || $[6] !== drawerSlug || $[7] !== featureKey || $[8] !== fieldMapOverride || $[9] !== schemaFieldsPathOverride || $[10] !== schemaPath || $[11] !== schemaPathSuffix || $[12] !== t1 || $[13] !== t2) {
    t3 = _jsx(EditDepthProvider, {
      children: _jsx(Drawer, {
        className,
        slug: drawerSlug,
        title: t1,
        children: _jsx(DrawerContent, {
          data,
          featureKey,
          fieldMapOverride,
          handleDrawerSubmit: t2,
          schemaFieldsPathOverride,
          schemaPath,
          schemaPathSuffix
        })
      })
    });
    $[4] = className;
    $[5] = data;
    $[6] = drawerSlug;
    $[7] = featureKey;
    $[8] = fieldMapOverride;
    $[9] = schemaFieldsPathOverride;
    $[10] = schemaPath;
    $[11] = schemaPathSuffix;
    $[12] = t1;
    $[13] = t2;
    $[14] = t3;
  } else {
    t3 = $[14];
  }
  return t3;
};
//# sourceMappingURL=Drawer.js.map