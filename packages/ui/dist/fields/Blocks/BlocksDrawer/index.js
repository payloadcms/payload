'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import React, { useEffect } from 'react';
import { Drawer } from '../../../elements/Drawer/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { BlockSelector } from '../BlockSelector/index.js';
export const BlocksDrawer = props => {
  const $ = _c(19);
  const {
    addRow,
    addRowIndex,
    blocks,
    drawerSlug,
    labels
  } = props;
  const {
    closeModal,
    isModalOpen
  } = useModal();
  const {
    i18n,
    t
  } = useTranslation();
  const [searchTermOverride, setSearchTermOverride] = React.useState("");
  let t0;
  let t1;
  if ($[0] !== drawerSlug || $[1] !== isModalOpen) {
    t0 = () => {
      if (!isModalOpen(drawerSlug)) {
        setSearchTermOverride("");
      }
    };
    t1 = [isModalOpen, drawerSlug];
    $[0] = drawerSlug;
    $[1] = isModalOpen;
    $[2] = t0;
    $[3] = t1;
  } else {
    t0 = $[2];
    t1 = $[3];
  }
  useEffect(t0, t1);
  let t2;
  if ($[4] !== addRow || $[5] !== addRowIndex || $[6] !== blocks || $[7] !== closeModal || $[8] !== drawerSlug || $[9] !== i18n || $[10] !== labels.singular || $[11] !== searchTermOverride || $[12] !== t) {
    let t3;
    if ($[14] !== addRow || $[15] !== addRowIndex || $[16] !== closeModal || $[17] !== drawerSlug) {
      t3 = slug => {
        addRow(addRowIndex, slug);
        closeModal(drawerSlug);
      };
      $[14] = addRow;
      $[15] = addRowIndex;
      $[16] = closeModal;
      $[17] = drawerSlug;
      $[18] = t3;
    } else {
      t3 = $[18];
    }
    t2 = _jsx(Drawer, {
      slug: drawerSlug,
      title: t("fields:addLabel", {
        label: getTranslation(labels.singular, i18n)
      }),
      children: _jsx(BlockSelector, {
        blocks,
        onSelect: t3,
        searchTerm: searchTermOverride
      })
    });
    $[4] = addRow;
    $[5] = addRowIndex;
    $[6] = blocks;
    $[7] = closeModal;
    $[8] = drawerSlug;
    $[9] = i18n;
    $[10] = labels.singular;
    $[11] = searchTermOverride;
    $[12] = t;
    $[13] = t2;
  } else {
    t2 = $[13];
  }
  return t2;
};
//# sourceMappingURL=index.js.map