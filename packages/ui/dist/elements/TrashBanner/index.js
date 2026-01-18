'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { TrashIcon } from '../../icons/Trash/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'trash-banner';
export const TrashBanner = () => {
  const {
    getEntityConfig
  } = useConfig();
  const {
    collectionSlug
  } = useDocumentInfo();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  const {
    labels
  } = collectionConfig;
  const {
    i18n
  } = useTranslation();
  return _jsxs("div", {
    className: baseClass,
    children: [_jsx(TrashIcon, {}), _jsx("p", {
      children: i18n.t("general:documentIsTrashed", {
        label: `${getTranslation(labels?.singular, i18n)}`
      })
    })]
  });
};
//# sourceMappingURL=index.js.map