'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { useRouter } from 'next/navigation.js';
import React from 'react';
import { useBulkUpload } from '../../../elements/BulkUpload/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Button } from '../../Button/index.js';
export function ListBulkUploadButton(t0) {
  const $ = _c(12);
  const {
    collectionSlug,
    hasCreatePermission,
    isBulkUploadEnabled,
    onBulkUploadSuccess,
    openBulkUpload: openBulkUploadFromProps
  } = t0;
  const {
    drawerSlug: bulkUploadDrawerSlug,
    setCollectionSlug,
    setOnSuccess
  } = useBulkUpload();
  const {
    t
  } = useTranslation();
  const {
    openModal
  } = useModal();
  const router = useRouter();
  let t1;
  if ($[0] !== bulkUploadDrawerSlug || $[1] !== collectionSlug || $[2] !== onBulkUploadSuccess || $[3] !== openBulkUploadFromProps || $[4] !== openModal || $[5] !== router || $[6] !== setCollectionSlug || $[7] !== setOnSuccess) {
    t1 = () => {
      if (typeof openBulkUploadFromProps === "function") {
        openBulkUploadFromProps();
      } else {
        setCollectionSlug(collectionSlug);
        openModal(bulkUploadDrawerSlug);
        setOnSuccess(() => {
          if (typeof onBulkUploadSuccess === "function") {
            onBulkUploadSuccess();
          } else {
            router.refresh();
          }
        });
      }
    };
    $[0] = bulkUploadDrawerSlug;
    $[1] = collectionSlug;
    $[2] = onBulkUploadSuccess;
    $[3] = openBulkUploadFromProps;
    $[4] = openModal;
    $[5] = router;
    $[6] = setCollectionSlug;
    $[7] = setOnSuccess;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  const openBulkUpload = t1;
  if (!hasCreatePermission || !isBulkUploadEnabled) {
    return null;
  }
  let t2;
  if ($[9] !== openBulkUpload || $[10] !== t) {
    t2 = _jsx(Button, {
      "aria-label": t("upload:bulkUpload"),
      buttonStyle: "pill",
      onClick: openBulkUpload,
      size: "small",
      children: t("upload:bulkUpload")
    }, "bulk-upload-button");
    $[9] = openBulkUpload;
    $[10] = t;
    $[11] = t2;
  } else {
    t2 = $[11];
  }
  return t2;
}
//# sourceMappingURL=ListBulkUploadButton.js.map