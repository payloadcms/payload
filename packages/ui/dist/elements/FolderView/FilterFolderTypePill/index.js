'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useConfig } from '../../../providers/Config/index.js';
import { useFolder } from '../../../providers/Folders/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Button } from '../../Button/index.js';
import { CheckboxPopup } from '../../CheckboxPopup/index.js';
import './index.scss';
const baseClass = 'collection-type';
export function FilterFolderTypePill() {
  const $ = _c(13);
  const {
    activeCollectionFolderSlugs: visibleCollectionSlugs,
    allCollectionFolderSlugs: folderCollectionSlugs,
    folderCollectionSlug,
    refineFolderData
  } = useFolder();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    config,
    getEntityConfig
  } = useConfig();
  let t0;
  if ($[0] !== config || $[1] !== folderCollectionSlug || $[2] !== folderCollectionSlugs || $[3] !== getEntityConfig || $[4] !== i18n) {
    t0 = () => config.collections.reduce((acc, collection) => {
      if (collection.folders && folderCollectionSlugs.includes(collection.slug)) {
        acc.push({
          label: getTranslation(collection.labels?.plural, i18n),
          value: collection.slug
        });
      }
      return acc;
    }, [{
      label: getTranslation(getEntityConfig({
        collectionSlug: folderCollectionSlug
      }).labels?.plural, i18n),
      value: folderCollectionSlug
    }]);
    $[0] = config;
    $[1] = folderCollectionSlug;
    $[2] = folderCollectionSlugs;
    $[3] = getEntityConfig;
    $[4] = i18n;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  const [allCollectionOptions] = React.useState(t0);
  let t1;
  if ($[6] !== allCollectionOptions || $[7] !== refineFolderData || $[8] !== t || $[9] !== visibleCollectionSlugs) {
    let t2;
    if ($[11] !== refineFolderData) {
      t2 = t3 => {
        const {
          selectedValues: relationTo
        } = t3;
        refineFolderData({
          query: {
            relationTo
          },
          updateURL: true
        });
      };
      $[11] = refineFolderData;
      $[12] = t2;
    } else {
      t2 = $[12];
    }
    t1 = _jsx(CheckboxPopup, {
      Button: _jsxs(Button, {
        buttonStyle: "pill",
        el: "div",
        icon: "chevron",
        margin: false,
        size: "small",
        children: [visibleCollectionSlugs.length ? _jsx("span", {
          className: `${baseClass}__count`,
          children: visibleCollectionSlugs.length
        }) : null, t("version:type")]
      }),
      onChange: t2,
      options: allCollectionOptions,
      selectedValues: visibleCollectionSlugs
    }, "relation-to-selection-popup");
    $[6] = allCollectionOptions;
    $[7] = refineFolderData;
    $[8] = t;
    $[9] = visibleCollectionSlugs;
    $[10] = t1;
  } else {
    t1 = $[10];
  }
  return t1;
}
//# sourceMappingURL=index.js.map