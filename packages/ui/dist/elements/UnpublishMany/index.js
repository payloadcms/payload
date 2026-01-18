'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import React from 'react';
import { useAuth } from '../../providers/Auth/index.js';
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { ListSelectionButton } from '../ListSelection/index.js';
import { UnpublishManyDrawerContent } from './DrawerContent.js';
export const UnpublishMany = props => {
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
    t2 = _jsx(UnpublishMany_v4, {
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
export const UnpublishMany_v4 = props => {
  const $ = _c(12);
  const {
    collection,
    collection: t0,
    count,
    ids,
    modalPrefix,
    onSuccess,
    selectAll,
    where
  } = props;
  const {
    slug,
    versions
  } = t0 === undefined ? {} : t0;
  const {
    t
  } = useTranslation();
  const {
    permissions
  } = useAuth();
  const {
    toggleModal
  } = useModal();
  const collectionPermissions = permissions?.collections?.[slug];
  const hasPermission = collectionPermissions?.update;
  const drawerSlug = `${modalPrefix ? `${modalPrefix}-` : ""}unpublish-${slug}`;
  if (!versions?.drafts || count === 0 || !hasPermission) {
    return null;
  }
  let t1;
  if ($[0] !== collection || $[1] !== drawerSlug || $[2] !== ids || $[3] !== onSuccess || $[4] !== selectAll || $[5] !== t || $[6] !== toggleModal || $[7] !== where) {
    let t2;
    if ($[9] !== drawerSlug || $[10] !== toggleModal) {
      t2 = () => {
        toggleModal(drawerSlug);
      };
      $[9] = drawerSlug;
      $[10] = toggleModal;
      $[11] = t2;
    } else {
      t2 = $[11];
    }
    t1 = _jsxs(React.Fragment, {
      children: [_jsx(ListSelectionButton, {
        "aria-label": t("version:unpublish"),
        onClick: t2,
        children: t("version:unpublish")
      }), _jsx(UnpublishManyDrawerContent, {
        collection,
        drawerSlug,
        ids,
        onSuccess,
        selectAll,
        where
      })]
    });
    $[0] = collection;
    $[1] = drawerSlug;
    $[2] = ids;
    $[3] = onSuccess;
    $[4] = selectAll;
    $[5] = t;
    $[6] = toggleModal;
    $[7] = where;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  return t1;
};
//# sourceMappingURL=index.js.map