'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { validateMimeType } from 'payload/shared';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
import { useConfig } from '../../providers/Config/index.js';
import { EditDepthProvider } from '../../providers/EditDepth/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { UploadControlsProvider } from '../../providers/UploadControls/index.js';
import { Drawer, useDrawerDepth } from '../Drawer/index.js';
import { AddFilesView } from './AddFilesView/index.js';
import { AddingFilesView } from './AddingFilesView/index.js';
import { FormsManagerProvider, useFormsManager } from './FormsManager/index.js';
const drawerSlug = 'bulk-upload-drawer-slug';
function DrawerContent() {
  const {
    addFiles,
    forms,
    isInitializing
  } = useFormsManager();
  const {
    closeModal
  } = useModal();
  const {
    collectionSlug,
    drawerSlug
  } = useBulkUpload();
  const {
    getEntityConfig
  } = useConfig();
  const {
    t
  } = useTranslation();
  const uploadCollection = getEntityConfig({
    collectionSlug
  });
  const uploadConfig = uploadCollection?.upload;
  const uploadMimeTypes = uploadConfig?.mimeTypes;
  const onDrop = React.useCallback(acceptedFiles => {
    const fileTransfer = new DataTransfer();
    for (const candidateFile of acceptedFiles) {
      if (uploadMimeTypes === undefined || uploadMimeTypes.length === 0 || validateMimeType(candidateFile.type, uploadMimeTypes)) {
        fileTransfer.items.add(candidateFile);
      }
    }
    if (fileTransfer.files.length === 0) {
      toast.error(t('error:invalidFileType'));
    } else {
      void addFiles(fileTransfer.files);
    }
  }, [addFiles, t, uploadMimeTypes]);
  if (!collectionSlug) {
    return null;
  }
  if (!forms.length && !isInitializing) {
    return /*#__PURE__*/_jsx(AddFilesView, {
      acceptMimeTypes: uploadMimeTypes?.join(', '),
      onCancel: () => closeModal(drawerSlug),
      onDrop: onDrop
    });
  } else {
    return /*#__PURE__*/_jsx(AddingFilesView, {});
  }
}
export function BulkUploadDrawer() {
  const $ = _c(17);
  const {
    drawerSlug,
    onCancel,
    setInitialFiles,
    setInitialForms,
    setOnCancel,
    setOnSuccess,
    setSelectableCollections,
    setSuccessfullyUploaded,
    successfullyUploaded
  } = useBulkUpload();
  const {
    modalState
  } = useModal();
  const previousModalStateRef = React.useRef(modalState);
  let t0;
  if ($[0] !== drawerSlug || $[1] !== onCancel || $[2] !== setInitialFiles || $[3] !== setInitialForms || $[4] !== setOnCancel || $[5] !== setOnSuccess || $[6] !== setSelectableCollections || $[7] !== setSuccessfullyUploaded || $[8] !== successfullyUploaded) {
    t0 = modalState_0 => {
      const previousModalState = previousModalStateRef.current[drawerSlug];
      const currentModalState = modalState_0[drawerSlug];
      if (typeof currentModalState === "undefined" && typeof previousModalState === "undefined") {
        return;
      }
      if (previousModalState?.isOpen !== currentModalState?.isOpen) {
        if (!currentModalState?.isOpen) {
          if (!successfullyUploaded) {
            if (typeof onCancel === "function") {
              onCancel();
            }
          }
          setInitialFiles(undefined);
          setInitialForms(undefined);
          setOnCancel(_temp2);
          setOnSuccess(_temp4);
          setSelectableCollections(null);
          setSuccessfullyUploaded(false);
        }
      }
      previousModalStateRef.current = modalState_0;
    };
    $[0] = drawerSlug;
    $[1] = onCancel;
    $[2] = setInitialFiles;
    $[3] = setInitialForms;
    $[4] = setOnCancel;
    $[5] = setOnSuccess;
    $[6] = setSelectableCollections;
    $[7] = setSuccessfullyUploaded;
    $[8] = successfullyUploaded;
    $[9] = t0;
  } else {
    t0 = $[9];
  }
  const onModalStateChanged = useEffectEvent(t0);
  let t1;
  if ($[10] !== modalState || $[11] !== onModalStateChanged) {
    t1 = () => {
      onModalStateChanged(modalState);
    };
    $[10] = modalState;
    $[11] = onModalStateChanged;
    $[12] = t1;
  } else {
    t1 = $[12];
  }
  let t2;
  if ($[13] !== modalState) {
    t2 = [modalState];
    $[13] = modalState;
    $[14] = t2;
  } else {
    t2 = $[14];
  }
  useEffect(t1, t2);
  let t3;
  if ($[15] !== drawerSlug) {
    t3 = _jsx(Drawer, {
      gutter: false,
      Header: null,
      slug: drawerSlug,
      children: _jsx(FormsManagerProvider, {
        children: _jsx(UploadControlsProvider, {
          children: _jsx(EditDepthProvider, {
            children: _jsx(DrawerContent, {})
          })
        })
      })
    });
    $[15] = drawerSlug;
    $[16] = t3;
  } else {
    t3 = $[16];
  }
  return t3;
}
function _temp4() {
  return _temp3;
}
function _temp3() {
  return null;
}
function _temp2() {
  return _temp;
}
function _temp() {
  return null;
}
const Context = /*#__PURE__*/React.createContext({
  collectionSlug: '',
  drawerSlug: '',
  initialFiles: undefined,
  initialForms: [],
  maxFiles: undefined,
  onCancel: () => null,
  onSuccess: () => null,
  selectableCollections: null,
  setCollectionSlug: () => null,
  setInitialFiles: () => null,
  setInitialForms: () => null,
  setMaxFiles: () => null,
  setOnCancel: () => null,
  setOnSuccess: () => null,
  setSelectableCollections: () => null,
  setSuccessfullyUploaded: () => false,
  successfullyUploaded: false
});
export function BulkUploadProvider(t0) {
  const $ = _c(17);
  const {
    children,
    drawerSlugPrefix
  } = t0;
  const [selectableCollections, setSelectableCollections] = React.useState(null);
  const [collection, setCollection] = React.useState();
  const [onSuccessFunction, setOnSuccessFunction] = React.useState();
  const [onCancelFunction, setOnCancelFunction] = React.useState();
  const [initialFiles, setInitialFiles] = React.useState(undefined);
  const [initialForms, setInitialForms] = React.useState(undefined);
  const [maxFiles, setMaxFiles] = React.useState(undefined);
  const [successfullyUploaded, setSuccessfullyUploaded] = React.useState(false);
  const drawerSlug = `${drawerSlugPrefix ? `${drawerSlugPrefix}-` : ""}${useBulkUploadDrawerSlug()}`;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = onSuccess => {
      setOnSuccessFunction(() => onSuccess);
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const setOnSuccess = t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = onCancel => {
      setOnCancelFunction(() => onCancel);
    };
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const setOnCancel = t2;
  let t3;
  if ($[2] !== onCancelFunction) {
    t3 = () => {
      if (typeof onCancelFunction === "function") {
        onCancelFunction();
      }
    };
    $[2] = onCancelFunction;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] !== onSuccessFunction) {
    t4 = (newDocs, errorCount) => {
      if (typeof onSuccessFunction === "function") {
        onSuccessFunction(newDocs, errorCount);
      }
    };
    $[4] = onSuccessFunction;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  let t5;
  if ($[6] !== children || $[7] !== collection || $[8] !== drawerSlug || $[9] !== initialFiles || $[10] !== initialForms || $[11] !== maxFiles || $[12] !== selectableCollections || $[13] !== successfullyUploaded || $[14] !== t3 || $[15] !== t4) {
    t5 = _jsx(Context, {
      value: {
        collectionSlug: collection,
        drawerSlug,
        initialFiles,
        initialForms,
        maxFiles,
        onCancel: t3,
        onSuccess: t4,
        selectableCollections,
        setCollectionSlug: setCollection,
        setInitialFiles,
        setInitialForms,
        setMaxFiles,
        setOnCancel,
        setOnSuccess,
        setSelectableCollections,
        setSuccessfullyUploaded,
        successfullyUploaded
      },
      children: _jsxs(React.Fragment, {
        children: [children, _jsx(BulkUploadDrawer, {})]
      })
    });
    $[6] = children;
    $[7] = collection;
    $[8] = drawerSlug;
    $[9] = initialFiles;
    $[10] = initialForms;
    $[11] = maxFiles;
    $[12] = selectableCollections;
    $[13] = successfullyUploaded;
    $[14] = t3;
    $[15] = t4;
    $[16] = t5;
  } else {
    t5 = $[16];
  }
  return t5;
}
export const useBulkUpload = () => React.use(Context);
export function useBulkUploadDrawerSlug() {
  const depth = useDrawerDepth();
  return `${drawerSlug}-${depth || 1}`;
}
//# sourceMappingURL=index.js.map