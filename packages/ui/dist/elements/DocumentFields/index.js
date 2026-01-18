'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fieldIsSidebar } from 'payload/shared';
import React, { useMemo } from 'react';
import { RenderFields } from '../../forms/RenderFields/index.js';
import { Gutter } from '../Gutter/index.js';
import { TrashBanner } from '../TrashBanner/index.js';
import './index.scss';
const baseClass = 'document-fields';
export const DocumentFields = ({
  AfterFields,
  BeforeFields,
  docPermissions,
  fields,
  forceSidebarWrap,
  isTrashed = false,
  readOnly,
  schemaPathSegments
}) => {
  const {
    hasSidebarFields,
    mainFields,
    sidebarFields
  } = useMemo(() => {
    return fields.reduce((acc, field) => {
      if (fieldIsSidebar(field)) {
        acc.sidebarFields.push(field);
        acc.mainFields.push(null);
        acc.hasSidebarFields = true;
      } else {
        acc.mainFields.push(field);
        acc.sidebarFields.push(null);
      }
      return acc;
    }, {
      hasSidebarFields: false,
      mainFields: [],
      sidebarFields: []
    });
  }, [fields]);
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, hasSidebarFields ? `${baseClass}--has-sidebar` : `${baseClass}--no-sidebar`, forceSidebarWrap && `${baseClass}--force-sidebar-wrap`].filter(Boolean).join(' '),
    children: [/*#__PURE__*/_jsx("div", {
      className: `${baseClass}__main`,
      children: /*#__PURE__*/_jsxs(Gutter, {
        className: `${baseClass}__edit`,
        children: [isTrashed && /*#__PURE__*/_jsx(TrashBanner, {}), BeforeFields, /*#__PURE__*/_jsx(RenderFields, {
          className: `${baseClass}__fields`,
          fields: mainFields,
          forceRender: true,
          parentIndexPath: "",
          parentPath: "",
          parentSchemaPath: schemaPathSegments.join('.'),
          permissions: docPermissions?.fields,
          readOnly: readOnly
        }), AfterFields]
      })
    }), hasSidebarFields ? /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__sidebar-wrap`,
      children: /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__sidebar`,
        children: /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__sidebar-fields`,
          children: /*#__PURE__*/_jsx(RenderFields, {
            fields: sidebarFields,
            forceRender: true,
            parentIndexPath: "",
            parentPath: "",
            parentSchemaPath: schemaPathSegments.join('.'),
            permissions: docPermissions?.fields,
            readOnly: readOnly
          })
        })
      })
    }) : null]
  });
};
//# sourceMappingURL=index.js.map