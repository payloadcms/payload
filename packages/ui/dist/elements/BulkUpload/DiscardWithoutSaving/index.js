'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import React from 'react';
import { useTranslation } from '../../../providers/Translation/index.js';
import { ConfirmationModal } from '../../ConfirmationModal/index.js';
import { useBulkUpload } from '../index.js';
export const discardBulkUploadModalSlug = 'bulk-upload--discard-without-saving';
export function DiscardWithoutSaving() {
  const $ = _c(9);
  const {
    t
  } = useTranslation();
  const {
    closeModal
  } = useModal();
  const {
    drawerSlug
  } = useBulkUpload();
  let t0;
  if ($[0] !== closeModal) {
    t0 = () => {
      closeModal(discardBulkUploadModalSlug);
    };
    $[0] = closeModal;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onCancel = t0;
  let t1;
  if ($[2] !== closeModal || $[3] !== drawerSlug) {
    t1 = () => {
      closeModal(drawerSlug);
      closeModal(discardBulkUploadModalSlug);
    };
    $[2] = closeModal;
    $[3] = drawerSlug;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const onConfirm = t1;
  let t2;
  if ($[5] !== onCancel || $[6] !== onConfirm || $[7] !== t) {
    t2 = _jsx(ConfirmationModal, {
      body: t("general:changesNotSaved"),
      cancelLabel: t("general:stayOnThisPage"),
      confirmLabel: t("general:leaveAnyway"),
      heading: t("general:leaveWithoutSaving"),
      modalSlug: discardBulkUploadModalSlug,
      onCancel,
      onConfirm
    });
    $[5] = onCancel;
    $[6] = onConfirm;
    $[7] = t;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  return t2;
}
//# sourceMappingURL=index.js.map