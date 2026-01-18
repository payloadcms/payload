'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { ArrayAction } from '../../elements/ArrayAction/index.js';
import { Collapsible } from '../../elements/Collapsible/index.js';
import { ErrorPill } from '../../elements/ErrorPill/index.js';
import { ShimmerEffect } from '../../elements/ShimmerEffect/index.js';
import { useFormSubmitted } from '../../forms/Form/context.js';
import { RenderFields } from '../../forms/RenderFields/index.js';
import { RowLabel } from '../../forms/RowLabel/index.js';
import { useThrottledValue } from '../../hooks/useThrottledValue.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'array-field';
export const ArrayRow = t0 => {
  const $ = _c(41);
  const {
    addRow,
    attributes,
    copyRow,
    CustomRowLabel,
    duplicateRow,
    errorCount,
    fields,
    forceRender: t1,
    hasMaxRows,
    isDragging,
    isLoading: isLoadingFromProps,
    isSortable,
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
    scrollIdPrefix,
    setCollapse,
    setNodeRef,
    transform,
    transition
  } = t0;
  const forceRender = t1 === undefined ? false : t1;
  const isLoading = useThrottledValue(isLoadingFromProps, 500);
  const {
    i18n
  } = useTranslation();
  const hasSubmitted = useFormSubmitted();
  const fallbackLabel = `${getTranslation(labels.singular, i18n)} ${String(rowIndex + 1).padStart(2, "0")}`;
  const fieldHasErrors = errorCount > 0 && hasSubmitted;
  const t2 = fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`;
  let t3;
  if ($[0] !== t2) {
    t3 = [`${baseClass}__row`, t2].filter(Boolean);
    $[0] = t2;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  const classNames = t3.join(" ");
  const t4 = `${parentPath.split(".").join("-")}-row-${rowIndex}`;
  const t5 = isDragging ? 1 : undefined;
  let t6;
  if ($[2] !== CustomRowLabel || $[3] !== addRow || $[4] !== attributes || $[5] !== classNames || $[6] !== copyRow || $[7] !== duplicateRow || $[8] !== errorCount || $[9] !== fallbackLabel || $[10] !== fieldHasErrors || $[11] !== fields || $[12] !== forceRender || $[13] !== hasMaxRows || $[14] !== i18n || $[15] !== isLoading || $[16] !== isSortable || $[17] !== listeners || $[18] !== moveRow || $[19] !== parentPath || $[20] !== pasteRow || $[21] !== path || $[22] !== permissions || $[23] !== readOnly || $[24] !== removeRow || $[25] !== row.collapsed || $[26] !== row.id || $[27] !== rowCount || $[28] !== rowIndex || $[29] !== schemaPath || $[30] !== scrollIdPrefix || $[31] !== setCollapse || $[32] !== setNodeRef || $[33] !== t4 || $[34] !== t5 || $[35] !== transform || $[36] !== transition) {
    let t7;
    if ($[38] !== row.id || $[39] !== setCollapse) {
      t7 = collapsed => setCollapse(row.id, collapsed);
      $[38] = row.id;
      $[39] = setCollapse;
      $[40] = t7;
    } else {
      t7 = $[40];
    }
    t6 = _jsx("div", {
      id: t4,
      ref: setNodeRef,
      style: {
        transform,
        transition,
        zIndex: t5
      },
      children: _jsx(Collapsible, {
        actions: !readOnly ? _jsx(ArrayAction, {
          addRow,
          copyRow,
          duplicateRow,
          hasMaxRows,
          index: rowIndex,
          isSortable,
          moveRow,
          pasteRow,
          removeRow,
          rowCount
        }) : undefined,
        className: classNames,
        collapsibleStyle: fieldHasErrors ? "error" : "default",
        dragHandleProps: isSortable ? {
          id: row.id,
          attributes,
          listeners
        } : undefined,
        header: _jsxs("div", {
          className: `${baseClass}__row-header`,
          id: `${scrollIdPrefix}-row-${rowIndex}`,
          children: [isLoading ? _jsx(ShimmerEffect, {
            height: "1rem",
            width: "8rem"
          }) : _jsx(RowLabel, {
            CustomComponent: CustomRowLabel,
            label: fallbackLabel,
            path,
            rowNumber: rowIndex
          }), fieldHasErrors && _jsx(ErrorPill, {
            count: errorCount,
            i18n,
            withMessage: true
          })]
        }),
        isCollapsed: row.collapsed,
        onToggle: t7,
        children: isLoading ? _jsx(ShimmerEffect, {}) : _jsx(RenderFields, {
          className: `${baseClass}__fields`,
          fields,
          forceRender,
          margins: "small",
          parentIndexPath: "",
          parentPath: path,
          parentSchemaPath: schemaPath,
          permissions: permissions === true ? permissions : permissions?.fields,
          readOnly
        })
      })
    }, `${parentPath}-row-${row.id}`);
    $[2] = CustomRowLabel;
    $[3] = addRow;
    $[4] = attributes;
    $[5] = classNames;
    $[6] = copyRow;
    $[7] = duplicateRow;
    $[8] = errorCount;
    $[9] = fallbackLabel;
    $[10] = fieldHasErrors;
    $[11] = fields;
    $[12] = forceRender;
    $[13] = hasMaxRows;
    $[14] = i18n;
    $[15] = isLoading;
    $[16] = isSortable;
    $[17] = listeners;
    $[18] = moveRow;
    $[19] = parentPath;
    $[20] = pasteRow;
    $[21] = path;
    $[22] = permissions;
    $[23] = readOnly;
    $[24] = removeRow;
    $[25] = row.collapsed;
    $[26] = row.id;
    $[27] = rowCount;
    $[28] = rowIndex;
    $[29] = schemaPath;
    $[30] = scrollIdPrefix;
    $[31] = setCollapse;
    $[32] = setNodeRef;
    $[33] = t4;
    $[34] = t5;
    $[35] = transform;
    $[36] = transition;
    $[37] = t6;
  } else {
    t6 = $[37];
  }
  return t6;
};
//# sourceMappingURL=ArrayRow.js.map