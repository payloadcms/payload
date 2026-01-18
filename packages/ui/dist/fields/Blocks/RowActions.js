'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import React from 'react';
import { ArrayAction } from '../../elements/ArrayAction/index.js';
import { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js';
import { BlocksDrawer } from './BlocksDrawer/index.js';
export const RowActions = props => {
  const $ = _c(28);
  const {
    addRow,
    blocks,
    blockType,
    copyRow,
    duplicateRow,
    hasMaxRows,
    isSortable,
    labels,
    moveRow,
    pasteRow,
    removeRow,
    rowCount,
    rowIndex
  } = props;
  const {
    closeModal,
    openModal
  } = useModal();
  const drawerSlug = useDrawerSlug("blocks-drawer");
  const [indexToAdd, setIndexToAdd] = React.useState(null);
  let t0;
  if ($[0] !== addRow || $[1] !== closeModal || $[2] !== drawerSlug || $[3] !== indexToAdd) {
    t0 = (_, rowBlockType) => {
      if (typeof addRow === "function") {
        addRow(indexToAdd, rowBlockType);
      }
      closeModal(drawerSlug);
    };
    $[0] = addRow;
    $[1] = closeModal;
    $[2] = drawerSlug;
    $[3] = indexToAdd;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  let t1;
  if ($[5] !== blockType || $[6] !== blocks || $[7] !== copyRow || $[8] !== drawerSlug || $[9] !== duplicateRow || $[10] !== hasMaxRows || $[11] !== isSortable || $[12] !== labels || $[13] !== moveRow || $[14] !== openModal || $[15] !== pasteRow || $[16] !== removeRow || $[17] !== rowCount || $[18] !== rowIndex || $[19] !== t0) {
    let t2;
    if ($[21] !== drawerSlug || $[22] !== openModal) {
      t2 = index => {
        setIndexToAdd(index);
        openModal(drawerSlug);
      };
      $[21] = drawerSlug;
      $[22] = openModal;
      $[23] = t2;
    } else {
      t2 = $[23];
    }
    let t3;
    if ($[24] !== blockType || $[25] !== duplicateRow || $[26] !== rowIndex) {
      t3 = () => duplicateRow(rowIndex, blockType);
      $[24] = blockType;
      $[25] = duplicateRow;
      $[26] = rowIndex;
      $[27] = t3;
    } else {
      t3 = $[27];
    }
    t1 = _jsxs(React.Fragment, {
      children: [_jsx(BlocksDrawer, {
        addRow: t0,
        addRowIndex: rowIndex,
        blocks,
        drawerSlug,
        labels
      }), _jsx(ArrayAction, {
        addRow: t2,
        copyRow,
        duplicateRow: t3,
        hasMaxRows,
        index: rowIndex,
        isSortable,
        moveRow,
        pasteRow,
        removeRow,
        rowCount
      })]
    });
    $[5] = blockType;
    $[6] = blocks;
    $[7] = copyRow;
    $[8] = drawerSlug;
    $[9] = duplicateRow;
    $[10] = hasMaxRows;
    $[11] = isSortable;
    $[12] = labels;
    $[13] = moveRow;
    $[14] = openModal;
    $[15] = pasteRow;
    $[16] = removeRow;
    $[17] = rowCount;
    $[18] = rowIndex;
    $[19] = t0;
    $[20] = t1;
  } else {
    t1 = $[20];
  }
  return t1;
};
//# sourceMappingURL=RowActions.js.map