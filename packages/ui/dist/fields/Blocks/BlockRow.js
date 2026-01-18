'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { Collapsible } from '../../elements/Collapsible/index.js';
import { ErrorPill } from '../../elements/ErrorPill/index.js';
import { Pill } from '../../elements/Pill/index.js';
import { ShimmerEffect } from '../../elements/ShimmerEffect/index.js';
import { useFormSubmitted } from '../../forms/Form/context.js';
import { RenderFields } from '../../forms/RenderFields/index.js';
import { RowLabel } from '../../forms/RowLabel/index.js';
import { useThrottledValue } from '../../hooks/useThrottledValue.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { RowActions } from './RowActions.js';
import { SectionTitle } from './SectionTitle/index.js';
const baseClass = 'blocks-field';
export const BlockRow = t0 => {
  const $ = _c(42);
  const {
    addRow,
    attributes,
    block,
    blocks,
    copyRow,
    duplicateRow,
    errorCount,
    fields,
    hasMaxRows,
    isLoading: isLoadingFromProps,
    isSortable,
    Label,
    labels,
    listeners,
    moveRow,
    parentPath,
    pasteRow,
    path,
    permissions,
    readOnly,
    removeRow,
    row,
    rowCount,
    rowIndex,
    schemaPath,
    setCollapse,
    setNodeRef,
    transform
  } = t0;
  const isLoading = useThrottledValue(isLoadingFromProps, 500);
  const {
    i18n
  } = useTranslation();
  const hasSubmitted = useFormSubmitted();
  const fieldHasErrors = hasSubmitted && errorCount > 0;
  const showBlockName = !block.admin?.disableBlockName;
  const t1 = fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`;
  let t2;
  if ($[0] !== t1) {
    t2 = [`${baseClass}__row`, t1].filter(Boolean);
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const classNames = t2.join(" ");
  let t3;
  if ($[2] !== Label || $[3] !== addRow || $[4] !== attributes || $[5] !== block.fields || $[6] !== block.labels || $[7] !== block.slug || $[8] !== blocks || $[9] !== classNames || $[10] !== copyRow || $[11] !== duplicateRow || $[12] !== errorCount || $[13] !== fieldHasErrors || $[14] !== fields || $[15] !== hasMaxRows || $[16] !== i18n || $[17] !== isLoading || $[18] !== isSortable || $[19] !== labels || $[20] !== listeners || $[21] !== moveRow || $[22] !== parentPath || $[23] !== pasteRow || $[24] !== path || $[25] !== permissions || $[26] !== readOnly || $[27] !== removeRow || $[28] !== row.blockType || $[29] !== row.collapsed || $[30] !== row.id || $[31] !== rowCount || $[32] !== rowIndex || $[33] !== schemaPath || $[34] !== setCollapse || $[35] !== setNodeRef || $[36] !== showBlockName || $[37] !== transform) {
    let blockPermissions;
    if (permissions === true) {
      blockPermissions = true;
    } else {
      const permissionsBlockSpecific = permissions?.blocks?.[block.slug] || permissions?.blocks;
      if (permissionsBlockSpecific === true) {
        blockPermissions = true;
      } else {
        if (permissionsBlockSpecific?.fields) {
          blockPermissions = permissionsBlockSpecific.fields;
        } else {
          if (typeof permissions === "object" && permissions && !permissionsBlockSpecific) {
            const hasReadPermission = permissions.read === true;
            const missingCreateOrUpdate = !permissions.create || !permissions.update;
            const hasRestrictiveStructure = hasReadPermission && (missingCreateOrUpdate || typeof permissions === "object" && Object.keys(permissions).length === 1 && permissions.read);
            if (hasRestrictiveStructure) {
              blockPermissions = {
                read: true
              };
            } else {
              blockPermissions = permissionsBlockSpecific?.fields;
            }
          } else {
            blockPermissions = permissionsBlockSpecific?.fields;
          }
        }
      }
    }
    let t4;
    if ($[39] !== row.id || $[40] !== setCollapse) {
      t4 = collapsed => setCollapse(row.id, collapsed);
      $[39] = row.id;
      $[40] = setCollapse;
      $[41] = t4;
    } else {
      t4 = $[41];
    }
    t3 = _jsx("div", {
      id: `${parentPath?.split(".").join("-")}-row-${rowIndex}`,
      ref: setNodeRef,
      style: {
        transform
      },
      children: _jsx(Collapsible, {
        actions: !readOnly ? _jsx(RowActions, {
          addRow,
          blocks,
          blockType: row.blockType,
          copyRow,
          duplicateRow,
          fields: block.fields,
          hasMaxRows,
          isSortable,
          labels,
          moveRow,
          pasteRow,
          removeRow,
          rowCount,
          rowIndex
        }) : undefined,
        className: classNames,
        collapsibleStyle: fieldHasErrors ? "error" : "default",
        dragHandleProps: isSortable ? {
          id: row.id,
          attributes,
          listeners
        } : undefined,
        header: isLoading ? _jsx(ShimmerEffect, {
          height: "1rem",
          width: "8rem"
        }) : _jsxs("div", {
          className: `${baseClass}__block-header`,
          children: [_jsx(RowLabel, {
            CustomComponent: Label,
            label: _jsxs(_Fragment, {
              children: [_jsx("span", {
                className: `${baseClass}__block-number`,
                children: String(rowIndex + 1).padStart(2, "0")
              }), _jsx(Pill, {
                className: `${baseClass}__block-pill ${baseClass}__block-pill-${row.blockType}`,
                pillStyle: "white",
                size: "small",
                children: getTranslation(block.labels.singular, i18n)
              }), showBlockName && _jsx(SectionTitle, {
                path: `${path}.blockName`,
                readOnly
              })]
            }),
            path,
            rowNumber: rowIndex
          }), fieldHasErrors && _jsx(ErrorPill, {
            count: errorCount,
            i18n,
            withMessage: true
          })]
        }),
        isCollapsed: row.collapsed,
        onToggle: t4,
        children: isLoading ? _jsx(ShimmerEffect, {}) : _jsx(RenderFields, {
          className: `${baseClass}__fields`,
          fields,
          margins: "small",
          parentIndexPath: "",
          parentPath: path,
          parentSchemaPath: schemaPath,
          permissions: blockPermissions,
          readOnly
        })
      }, row.id)
    }, `${parentPath}-row-${rowIndex}`);
    $[2] = Label;
    $[3] = addRow;
    $[4] = attributes;
    $[5] = block.fields;
    $[6] = block.labels;
    $[7] = block.slug;
    $[8] = blocks;
    $[9] = classNames;
    $[10] = copyRow;
    $[11] = duplicateRow;
    $[12] = errorCount;
    $[13] = fieldHasErrors;
    $[14] = fields;
    $[15] = hasMaxRows;
    $[16] = i18n;
    $[17] = isLoading;
    $[18] = isSortable;
    $[19] = labels;
    $[20] = listeners;
    $[21] = moveRow;
    $[22] = parentPath;
    $[23] = pasteRow;
    $[24] = path;
    $[25] = permissions;
    $[26] = readOnly;
    $[27] = removeRow;
    $[28] = row.blockType;
    $[29] = row.collapsed;
    $[30] = row.id;
    $[31] = rowCount;
    $[32] = rowIndex;
    $[33] = schemaPath;
    $[34] = setCollapse;
    $[35] = setNodeRef;
    $[36] = showBlockName;
    $[37] = transform;
    $[38] = t3;
  } else {
    t3 = $[38];
  }
  return t3;
};
//# sourceMappingURL=BlockRow.js.map