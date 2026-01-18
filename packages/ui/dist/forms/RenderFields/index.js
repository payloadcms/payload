'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { fieldIsHiddenOrDisabled, getFieldPaths, getFieldPermissions } from 'payload/shared';
import React from 'react';
import { RenderIfInViewport } from '../../elements/RenderIfInViewport/index.js';
import { useOperation } from '../../providers/Operation/index.js';
import './index.scss';
import { FieldPathContext } from './context.js';
import { RenderField } from './RenderField.js';
const baseClass = 'render-fields';
export const RenderFields = props => {
  const $ = _c(22);
  const {
    className,
    fields,
    forceRender,
    margins,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
    permissions,
    readOnly: readOnlyFromParent
  } = props;
  const operation = useOperation();
  if (fields && fields.length > 0) {
    const t0 = margins && `${baseClass}--margins-${margins}`;
    const t1 = margins === false && `${baseClass}--margins-none`;
    let t2;
    if ($[0] !== className || $[1] !== t0 || $[2] !== t1) {
      t2 = [baseClass, className, t0, t1].filter(Boolean);
      $[0] = className;
      $[1] = t0;
      $[2] = t1;
      $[3] = t2;
    } else {
      t2 = $[3];
    }
    const t3 = t2.join(" ");
    let t4;
    if ($[4] !== fields || $[5] !== forceRender || $[6] !== operation || $[7] !== parentIndexPath || $[8] !== parentPath || $[9] !== parentSchemaPath || $[10] !== permissions || $[11] !== readOnlyFromParent || $[12] !== t3) {
      let t5;
      if ($[14] !== forceRender || $[15] !== operation || $[16] !== parentIndexPath || $[17] !== parentPath || $[18] !== parentSchemaPath || $[19] !== permissions || $[20] !== readOnlyFromParent) {
        t5 = (field, i) => {
          if (!field || fieldIsHiddenOrDisabled(field)) {
            return null;
          }
          const {
            operation: hasOperationPermission,
            permissions: fieldPermissions,
            read: hasReadPermission
          } = getFieldPermissions({
            field,
            operation,
            parentName: parentPath?.includes(".") ? parentPath.split(".")[parentPath.split(".").length - 1] : parentPath,
            permissions
          });
          if ("name" in field && !hasReadPermission) {
            return null;
          }
          let isReadOnly = readOnlyFromParent || field?.admin?.readOnly;
          if (isReadOnly && field.admin?.readOnly === false) {
            isReadOnly = false;
          }
          if ("name" in field && !hasOperationPermission) {
            isReadOnly = true;
          }
          const {
            indexPath,
            path,
            schemaPath
          } = getFieldPaths({
            field,
            index: i,
            parentIndexPath,
            parentPath,
            parentSchemaPath
          });
          return _jsx(FieldPathContext, {
            value: path,
            children: _jsx(RenderField, {
              clientFieldConfig: field,
              forceRender,
              indexPath,
              parentPath,
              parentSchemaPath,
              path,
              permissions: fieldPermissions,
              readOnly: isReadOnly,
              schemaPath
            })
          }, `${path}-${i}`);
        };
        $[14] = forceRender;
        $[15] = operation;
        $[16] = parentIndexPath;
        $[17] = parentPath;
        $[18] = parentSchemaPath;
        $[19] = permissions;
        $[20] = readOnlyFromParent;
        $[21] = t5;
      } else {
        t5 = $[21];
      }
      t4 = _jsx(RenderIfInViewport, {
        className: t3,
        forceRender,
        children: fields.map(t5)
      });
      $[4] = fields;
      $[5] = forceRender;
      $[6] = operation;
      $[7] = parentIndexPath;
      $[8] = parentPath;
      $[9] = parentSchemaPath;
      $[10] = permissions;
      $[11] = readOnlyFromParent;
      $[12] = t3;
      $[13] = t4;
    } else {
      t4 = $[13];
    }
    return t4;
  }
  return null;
};
//# sourceMappingURL=index.js.map