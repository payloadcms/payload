'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Fragment, useCallback } from 'react';
import { DeleteMany } from '../../../elements/DeleteMany/index.js';
import { EditMany_v4 } from '../../../elements/EditMany/index.js';
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js';
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js';
import { RestoreMany } from '../../../elements/RestoreMany/index.js';
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js';
import { SelectAllStatus, useSelection } from '../../../providers/Selection/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
export const ListSelection = t0 => {
  const $ = _c(19);
  const {
    collectionConfig,
    disableBulkDelete,
    disableBulkEdit,
    label,
    modalPrefix,
    showSelectAllAcrossPages: t1,
    viewType,
    where
  } = t0;
  const showSelectAllAcrossPages = t1 === undefined ? true : t1;
  const {
    count,
    selectAll,
    selectedIDs,
    toggleAll,
    totalDocs
  } = useSelection();
  const {
    t
  } = useTranslation();
  let t2;
  if ($[0] !== toggleAll) {
    t2 = () => toggleAll();
    $[0] = toggleAll;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const onActionSuccess = t2;
  if (count === 0) {
    return null;
  }
  const isTrashView = collectionConfig?.trash && viewType === "trash";
  let t3;
  if ($[2] !== collectionConfig || $[3] !== count || $[4] !== disableBulkDelete || $[5] !== disableBulkEdit || $[6] !== isTrashView || $[7] !== label || $[8] !== modalPrefix || $[9] !== onActionSuccess || $[10] !== selectAll || $[11] !== selectedIDs || $[12] !== showSelectAllAcrossPages || $[13] !== t || $[14] !== toggleAll || $[15] !== totalDocs || $[16] !== viewType || $[17] !== where) {
    t3 = _jsx(ListSelection_v4, {
      count,
      ListActions: [selectAll !== SelectAllStatus.AllAvailable && count < totalDocs && showSelectAllAcrossPages !== false ? _jsx(ListSelectionButton, {
        "aria-label": t("general:selectAll", {
          count: `(${totalDocs})`,
          label
        }),
        id: "select-all-across-pages",
        onClick: () => toggleAll(true),
        children: t("general:selectAll", {
          count: `(${totalDocs})`,
          label: ""
        })
      }, "select-all") : null].filter(Boolean),
      SelectionActions: [!disableBulkEdit && !isTrashView && _jsxs(Fragment, {
        children: [_jsx(EditMany_v4, {
          collection: collectionConfig,
          count,
          ids: selectedIDs,
          modalPrefix,
          onSuccess: onActionSuccess,
          selectAll: selectAll === SelectAllStatus.AllAvailable,
          where
        }), _jsx(PublishMany_v4, {
          collection: collectionConfig,
          count,
          ids: selectedIDs,
          modalPrefix,
          onSuccess: onActionSuccess,
          selectAll: selectAll === SelectAllStatus.AllAvailable,
          where
        }), _jsx(UnpublishMany_v4, {
          collection: collectionConfig,
          count,
          ids: selectedIDs,
          modalPrefix,
          onSuccess: onActionSuccess,
          selectAll: selectAll === SelectAllStatus.AllAvailable,
          where
        })]
      }, "bulk-actions"), isTrashView && _jsx(RestoreMany, {
        collection: collectionConfig,
        viewType
      }, "bulk-restore"), !disableBulkDelete && _jsx(DeleteMany, {
        collection: collectionConfig,
        modalPrefix,
        viewType
      }, "bulk-delete")].filter(Boolean)
    });
    $[2] = collectionConfig;
    $[3] = count;
    $[4] = disableBulkDelete;
    $[5] = disableBulkEdit;
    $[6] = isTrashView;
    $[7] = label;
    $[8] = modalPrefix;
    $[9] = onActionSuccess;
    $[10] = selectAll;
    $[11] = selectedIDs;
    $[12] = showSelectAllAcrossPages;
    $[13] = t;
    $[14] = toggleAll;
    $[15] = totalDocs;
    $[16] = viewType;
    $[17] = where;
    $[18] = t3;
  } else {
    t3 = $[18];
  }
  return t3;
};
//# sourceMappingURL=index.js.map