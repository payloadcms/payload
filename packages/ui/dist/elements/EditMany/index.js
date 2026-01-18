'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import React, { useState } from 'react';
import { useAuth } from '../../providers/Auth/index.js';
import { EditDepthProvider } from '../../providers/EditDepth/index.js';
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Drawer } from '../Drawer/index.js';
import { ListSelectionButton } from '../ListSelection/index.js';
import { EditManyDrawerContent } from './DrawerContent.js';
import './index.scss';
export const baseClass = 'edit-many';
export const EditMany = props => {
  const $ = _c(8);
  const {
    count,
    selectAll,
    selectedIDs,
    toggleAll
  } = useSelection();
  let t0;
  if ($[0] !== toggleAll) {
    t0 = () => toggleAll();
    $[0] = toggleAll;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const t1 = selectAll === SelectAllStatus.AllAvailable;
  let t2;
  if ($[2] !== count || $[3] !== props || $[4] !== selectedIDs || $[5] !== t0 || $[6] !== t1) {
    t2 = _jsx(EditMany_v4, {
      ...props,
      count,
      ids: selectedIDs,
      onSuccess: t0,
      selectAll: t1
    });
    $[2] = count;
    $[3] = props;
    $[4] = selectedIDs;
    $[5] = t0;
    $[6] = t1;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
};
export const EditMany_v4 = t0 => {
  const $ = _c(16);
  const {
    collection,
    count,
    ids,
    modalPrefix,
    onSuccess,
    selectAll,
    where
  } = t0;
  const {
    permissions
  } = useAuth();
  const {
    openModal
  } = useModal();
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [selectedFields, setSelectedFields] = useState(t1);
  const collectionPermissions = permissions?.collections?.[collection.slug];
  const drawerSlug = `${modalPrefix ? `${modalPrefix}-` : ""}edit-${collection.slug}`;
  if (count === 0 || !collectionPermissions?.update) {
    return null;
  }
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [baseClass, `${baseClass}__toggle`].filter(Boolean);
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== collection || $[3] !== count || $[4] !== drawerSlug || $[5] !== ids || $[6] !== onSuccess || $[7] !== openModal || $[8] !== selectAll || $[9] !== selectedFields || $[10] !== t || $[11] !== where) {
    let t4;
    if ($[13] !== drawerSlug || $[14] !== openModal) {
      t4 = () => {
        openModal(drawerSlug);
        setSelectedFields([]);
      };
      $[13] = drawerSlug;
      $[14] = openModal;
      $[15] = t4;
    } else {
      t4 = $[15];
    }
    t3 = _jsxs("div", {
      className: t2.join(" "),
      children: [_jsx(ListSelectionButton, {
        "aria-label": t("general:edit"),
        onClick: t4,
        children: t("general:edit")
      }), _jsx(EditDepthProvider, {
        children: _jsx(Drawer, {
          Header: null,
          slug: drawerSlug,
          children: _jsx(EditManyDrawerContent, {
            collection,
            count,
            drawerSlug,
            ids,
            onSuccess,
            selectAll,
            selectedFields,
            setSelectedFields,
            where
          })
        })
      })]
    });
    $[2] = collection;
    $[3] = count;
    $[4] = drawerSlug;
    $[5] = ids;
    $[6] = onSuccess;
    $[7] = openModal;
    $[8] = selectAll;
    $[9] = selectedFields;
    $[10] = t;
    $[11] = where;
    $[12] = t3;
  } else {
    t3 = $[12];
  }
  return t3;
};
//# sourceMappingURL=index.js.map