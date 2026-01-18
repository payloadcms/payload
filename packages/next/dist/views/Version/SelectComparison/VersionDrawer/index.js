'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { Drawer, LoadingOverlay, toast, useDocumentInfo, useEditDepth, useModal, useServerFunctions, useTranslation } from '@payloadcms/ui';
import { useSearchParams } from 'next/navigation.js';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
export const baseClass = 'version-drawer';
export const formatVersionDrawerSlug = ({
  depth,
  uuid
}) => `version-drawer_${depth}_${uuid}`;
export const VersionDrawerContent = props => {
  const {
    collectionSlug,
    docID,
    drawerSlug,
    globalSlug
  } = props;
  const {
    isTrashed
  } = useDocumentInfo();
  const {
    closeModal
  } = useModal();
  const searchParams = useSearchParams();
  const prevSearchParams = useRef(searchParams);
  const {
    renderDocument
  } = useServerFunctions();
  const [DocumentView, setDocumentView] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const hasRenderedDocument = useRef(false);
  const {
    t
  } = useTranslation();
  const getDocumentView = useCallback(docID_0 => {
    const fetchDocumentView = async () => {
      setIsLoading(true);
      try {
        const isGlobal = Boolean(globalSlug);
        const entitySlug = collectionSlug ?? globalSlug;
        const result = await renderDocument({
          collectionSlug: entitySlug,
          docID: docID_0,
          drawerSlug,
          paramsOverride: {
            segments: [isGlobal ? 'globals' : 'collections', entitySlug, ...(isTrashed ? ['trash'] : []), isGlobal ? undefined : String(docID_0), 'versions'].filter(Boolean)
          },
          redirectAfterDelete: false,
          redirectAfterDuplicate: false,
          searchParams: Object.fromEntries(searchParams.entries()),
          versions: {
            disableGutter: true,
            useVersionDrawerCreatedAtCell: true
          }
        });
        if (result?.Document) {
          setDocumentView(result.Document);
          setIsLoading(false);
        }
      } catch (error) {
        toast.error(error?.message || t('error:unspecific'));
        closeModal(drawerSlug);
        // toast.error(data?.errors?.[0].message || t('error:unspecific'))
      }
    };
    void fetchDocumentView();
  }, [closeModal, collectionSlug, drawerSlug, globalSlug, isTrashed, renderDocument, searchParams, t]);
  useEffect(() => {
    if (!hasRenderedDocument.current || prevSearchParams.current !== searchParams) {
      prevSearchParams.current = searchParams;
      getDocumentView(docID);
      hasRenderedDocument.current = true;
    }
  }, [docID, getDocumentView, searchParams]);
  if (isLoading) {
    return /*#__PURE__*/_jsx(LoadingOverlay, {});
  }
  return DocumentView;
};
export const VersionDrawer = props => {
  const $ = _c(6);
  const {
    collectionSlug,
    docID,
    drawerSlug,
    globalSlug
  } = props;
  const {
    t
  } = useTranslation();
  let t0;
  if ($[0] !== collectionSlug || $[1] !== docID || $[2] !== drawerSlug || $[3] !== globalSlug || $[4] !== t) {
    t0 = _jsx(Drawer, {
      className: baseClass,
      gutter: true,
      slug: drawerSlug,
      title: t("version:selectVersionToCompare"),
      children: _jsx(VersionDrawerContent, {
        collectionSlug,
        docID,
        drawerSlug,
        globalSlug
      })
    });
    $[0] = collectionSlug;
    $[1] = docID;
    $[2] = drawerSlug;
    $[3] = globalSlug;
    $[4] = t;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
};
export const useVersionDrawer = t0 => {
  const $ = _c(29);
  const {
    collectionSlug,
    docID,
    globalSlug
  } = t0;
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const {
    closeModal,
    modalState,
    openModal,
    toggleModal
  } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  let t1;
  if ($[0] !== drawerDepth || $[1] !== uuid) {
    t1 = formatVersionDrawerSlug({
      depth: drawerDepth,
      uuid
    });
    $[0] = drawerDepth;
    $[1] = uuid;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const drawerSlug = t1;
  let t2;
  let t3;
  if ($[3] !== drawerSlug || $[4] !== modalState) {
    t2 = () => {
      setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
    };
    t3 = [modalState, drawerSlug];
    $[3] = drawerSlug;
    $[4] = modalState;
    $[5] = t2;
    $[6] = t3;
  } else {
    t2 = $[5];
    t3 = $[6];
  }
  useEffect(t2, t3);
  let t4;
  if ($[7] !== drawerSlug || $[8] !== toggleModal) {
    t4 = () => {
      toggleModal(drawerSlug);
    };
    $[7] = drawerSlug;
    $[8] = toggleModal;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const toggleDrawer = t4;
  let t5;
  if ($[10] !== closeModal || $[11] !== drawerSlug) {
    t5 = () => {
      closeModal(drawerSlug);
    };
    $[10] = closeModal;
    $[11] = drawerSlug;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  const closeDrawer = t5;
  let t6;
  if ($[13] !== drawerSlug || $[14] !== openModal) {
    t6 = () => {
      openModal(drawerSlug);
    };
    $[13] = drawerSlug;
    $[14] = openModal;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  const openDrawer = t6;
  let t7;
  if ($[16] !== collectionSlug || $[17] !== docID || $[18] !== drawerSlug || $[19] !== globalSlug) {
    t7 = () => _jsx(VersionDrawer, {
      collectionSlug,
      docID,
      drawerSlug,
      globalSlug
    });
    $[16] = collectionSlug;
    $[17] = docID;
    $[18] = drawerSlug;
    $[19] = globalSlug;
    $[20] = t7;
  } else {
    t7 = $[20];
  }
  const MemoizedDrawer = t7;
  let t8;
  if ($[21] !== MemoizedDrawer || $[22] !== closeDrawer || $[23] !== drawerDepth || $[24] !== drawerSlug || $[25] !== isOpen || $[26] !== openDrawer || $[27] !== toggleDrawer) {
    t8 = {
      closeDrawer,
      Drawer: MemoizedDrawer,
      drawerDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      toggleDrawer
    };
    $[21] = MemoizedDrawer;
    $[22] = closeDrawer;
    $[23] = drawerDepth;
    $[24] = drawerSlug;
    $[25] = isOpen;
    $[26] = openDrawer;
    $[27] = toggleDrawer;
    $[28] = t8;
  } else {
    t8 = $[28];
  }
  return t8;
};
//# sourceMappingURL=index.js.map