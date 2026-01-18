'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { reduceFieldsToValues } from 'payload/shared';
import React from 'react';
import { useAuth } from '../../../providers/Auth/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { DocumentInfoProvider } from '../../../providers/DocumentInfo/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { ActionsBar } from '../ActionsBar/index.js';
import { discardBulkUploadModalSlug, DiscardWithoutSaving } from '../DiscardWithoutSaving/index.js';
import { EditForm } from '../EditForm/index.js';
import { FileSidebar } from '../FileSidebar/index.js';
import { useFormsManager } from '../FormsManager/index.js';
import { DrawerHeader } from '../Header/index.js';
import './index.scss';
const baseClass = 'bulk-upload--file-manager';
export function AddingFilesView() {
  const $ = _c(18);
  const {
    activeIndex,
    collectionSlug,
    docPermissions,
    documentSlots,
    forms,
    hasPublishPermission,
    hasSavePermission,
    hasSubmitted,
    resetUploadEdits,
    updateUploadEdits
  } = useFormsManager();
  const activeForm = forms[activeIndex];
  const {
    getEntityConfig
  } = useConfig();
  const {
    i18n
  } = useTranslation();
  const {
    user
  } = useAuth();
  const {
    openModal
  } = useModal();
  let t0;
  if ($[0] !== activeForm || $[1] !== activeIndex || $[2] !== collectionSlug || $[3] !== docPermissions || $[4] !== documentSlots || $[5] !== forms.length || $[6] !== getEntityConfig || $[7] !== hasPublishPermission || $[8] !== hasSavePermission || $[9] !== hasSubmitted || $[10] !== i18n || $[11] !== openModal || $[12] !== resetUploadEdits || $[13] !== updateUploadEdits || $[14] !== user) {
    const collectionConfig = getEntityConfig({
      collectionSlug
    });
    let t1;
    if ($[16] !== openModal) {
      t1 = () => openModal(discardBulkUploadModalSlug);
      $[16] = openModal;
      $[17] = t1;
    } else {
      t1 = $[17];
    }
    t0 = _jsxs("div", {
      className: baseClass,
      children: [_jsx(FileSidebar, {}), _jsxs("div", {
        className: `${baseClass}__editView`,
        children: [_jsx(DrawerHeader, {
          onClose: t1,
          title: getTranslation(collectionConfig.labels.singular, i18n)
        }), activeForm ? _jsxs(DocumentInfoProvider, {
          collectionSlug,
          currentEditor: user,
          docPermissions,
          hasPublishedDoc: false,
          hasPublishPermission,
          hasSavePermission,
          id: null,
          initialData: reduceFieldsToValues(activeForm.formState, true),
          initialState: activeForm.formState,
          isLocked: false,
          lastUpdateTime: 0,
          mostRecentVersionIsAutosaved: false,
          unpublishedVersionCount: 0,
          Upload: documentSlots.Upload,
          versionCount: 0,
          children: [_jsx(ActionsBar, {
            collectionConfig
          }), _jsx(EditForm, {
            resetUploadEdits,
            submitted: hasSubmitted,
            updateUploadEdits,
            uploadEdits: activeForm?.uploadEdits
          })]
        }, `${activeIndex}-${forms.length}`) : null]
      }), _jsx(DiscardWithoutSaving, {})]
    });
    $[0] = activeForm;
    $[1] = activeIndex;
    $[2] = collectionSlug;
    $[3] = docPermissions;
    $[4] = documentSlots;
    $[5] = forms.length;
    $[6] = getEntityConfig;
    $[7] = hasPublishPermission;
    $[8] = hasSavePermission;
    $[9] = hasSubmitted;
    $[10] = i18n;
    $[11] = openModal;
    $[12] = resetUploadEdits;
    $[13] = updateUploadEdits;
    $[14] = user;
    $[15] = t0;
  } else {
    t0 = $[15];
  }
  return t0;
}
//# sourceMappingURL=index.js.map