'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
import { usePreferences } from '../../providers/Preferences/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Button } from '../Button/index.js';
import './index.scss';
const baseClass = 'default-list-view-tabs';
export const DefaultListViewTabs = t0 => {
  const $ = _c(20);
  const {
    collectionConfig,
    config,
    onChange,
    viewType
  } = t0;
  const {
    i18n,
    t
  } = useTranslation();
  const {
    setPreference
  } = usePreferences();
  const router = useRouter();
  const isTrashEnabled = collectionConfig.trash;
  const isFoldersEnabled = collectionConfig.folders && config.folders;
  if (!isTrashEnabled && !isFoldersEnabled) {
    return null;
  }
  let t1;
  if ($[0] !== collectionConfig.slug || $[1] !== config || $[2] !== onChange || $[3] !== router || $[4] !== setPreference) {
    t1 = async newViewType => {
      if (onChange) {
        onChange(newViewType);
      }
      if (newViewType === "list" || newViewType === "folders") {
        await setPreference(`collection-${collectionConfig.slug}`, {
          listViewType: newViewType
        });
      }
      let path = `/collections/${collectionConfig.slug}`;
      bb21: switch (newViewType) {
        case "folders":
          {
            if (config.folders) {
              path = `/collections/${collectionConfig.slug}/${config.folders.slug}`;
            }
            break bb21;
          }
        case "trash":
          {
            path = `/collections/${collectionConfig.slug}/trash`;
          }
      }
      const url = formatAdminURL({
        adminRoute: config.routes.admin,
        path
      });
      router.push(url);
    };
    $[0] = collectionConfig.slug;
    $[1] = config;
    $[2] = onChange;
    $[3] = router;
    $[4] = setPreference;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  const handleViewChange = t1;
  const allButtonLabel = `${t("general:all")} ${getTranslation(collectionConfig?.labels?.plural, i18n)}`;
  let t2;
  if ($[6] !== allButtonLabel || $[7] !== collectionConfig.labels?.plural || $[8] !== handleViewChange || $[9] !== i18n || $[10] !== isFoldersEnabled || $[11] !== isTrashEnabled || $[12] !== t || $[13] !== viewType) {
    let t3;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      t3 = /\s+/g;
      $[15] = t3;
    } else {
      t3 = $[15];
    }
    const allButtonId = allButtonLabel.toLowerCase().replace(t3, "-");
    const t4 = viewType === "list" && `${baseClass}__button--active`;
    let t5;
    if ($[16] !== t4) {
      t5 = [`${baseClass}__button`, t4].filter(Boolean);
      $[16] = t4;
      $[17] = t5;
    } else {
      t5 = $[17];
    }
    let t6;
    if ($[18] !== handleViewChange) {
      t6 = () => handleViewChange("list");
      $[18] = handleViewChange;
      $[19] = t6;
    } else {
      t6 = $[19];
    }
    t2 = _jsxs("div", {
      className: baseClass,
      children: [_jsxs(Button, {
        buttonStyle: "tab",
        className: t5.join(" "),
        disabled: viewType === "list",
        el: "button",
        id: allButtonId,
        onClick: t6,
        children: [t("general:all"), " ", getTranslation(collectionConfig?.labels?.plural, i18n)]
      }), isFoldersEnabled && _jsx(Button, {
        buttonStyle: "tab",
        className: [`${baseClass}__button`, viewType === "folders" && `${baseClass}__button--active`].filter(Boolean).join(" "),
        disabled: viewType === "folders",
        el: "button",
        onClick: () => handleViewChange("folders"),
        children: t("folder:byFolder")
      }), isTrashEnabled && _jsx(Button, {
        buttonStyle: "tab",
        className: [`${baseClass}__button`, viewType === "trash" && `${baseClass}__button--active`].filter(Boolean).join(" "),
        disabled: viewType === "trash",
        el: "button",
        id: "trash-view-pill",
        onClick: () => handleViewChange("trash"),
        children: t("general:trash")
      })]
    });
    $[6] = allButtonLabel;
    $[7] = collectionConfig.labels?.plural;
    $[8] = handleViewChange;
    $[9] = i18n;
    $[10] = isFoldersEnabled;
    $[11] = isTrashEnabled;
    $[12] = t;
    $[13] = viewType;
    $[14] = t2;
  } else {
    t2 = $[14];
  }
  return t2;
};
//# sourceMappingURL=index.js.map