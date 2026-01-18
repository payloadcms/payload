'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LoadingOverlay } from '../../elements/Loading/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useServerFunctions } from '../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js';
import { DocumentDrawerContextProvider } from './Provider.js';
export const DocumentDrawerContent = ({
  id: docID,
  collectionSlug,
  disableActions,
  drawerSlug,
  initialData,
  onDelete: onDeleteFromProps,
  onDuplicate: onDuplicateFromProps,
  onSave: onSaveFromProps,
  overrideEntityVisibility = true,
  redirectAfterCreate,
  redirectAfterDelete,
  redirectAfterDuplicate,
  redirectAfterRestore
}) => {
  const {
    getEntityConfig
  } = useConfig();
  const locale = useLocale();
  const [collectionConfig] = useState(() => getEntityConfig({
    collectionSlug
  }));
  const abortGetDocumentViewRef = React.useRef(null);
  const {
    closeModal
  } = useModal();
  const {
    t
  } = useTranslation();
  const {
    renderDocument
  } = useServerFunctions();
  const [DocumentView, setDocumentView] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);
  const getDocumentView = useCallback((docID_0, showLoadingIndicator = false) => {
    const controller = handleAbortRef(abortGetDocumentViewRef);
    const fetchDocumentView = async () => {
      if (showLoadingIndicator) {
        setIsLoading(true);
      }
      try {
        const result = await renderDocument({
          collectionSlug,
          disableActions,
          docID: docID_0,
          drawerSlug,
          initialData,
          locale,
          overrideEntityVisibility,
          redirectAfterCreate,
          redirectAfterDelete: redirectAfterDelete !== undefined ? redirectAfterDelete : false,
          redirectAfterDuplicate: redirectAfterDuplicate !== undefined ? redirectAfterDuplicate : false,
          redirectAfterRestore: redirectAfterRestore !== undefined ? redirectAfterRestore : false,
          signal: controller.signal
        });
        if (result?.Document) {
          setDocumentView(result.Document);
          setIsLoading(false);
        }
      } catch (error) {
        toast.error(error?.message || t('error:unspecific'));
        closeModal(drawerSlug);
      }
      abortGetDocumentViewRef.current = null;
    };
    void fetchDocumentView();
  }, [collectionSlug, disableActions, drawerSlug, initialData, redirectAfterDelete, redirectAfterDuplicate, redirectAfterRestore, renderDocument, redirectAfterCreate, closeModal, overrideEntityVisibility, t, locale]);
  const onSave = useCallback(args => {
    if (args.operation === 'create') {
      getDocumentView(args.doc.id);
    }
    if (typeof onSaveFromProps === 'function') {
      void onSaveFromProps({
        ...args,
        collectionConfig
      });
    }
  }, [onSaveFromProps, collectionConfig, getDocumentView]);
  const onDuplicate = useCallback(args_0 => {
    getDocumentView(args_0.doc.id);
    if (typeof onDuplicateFromProps === 'function') {
      void onDuplicateFromProps({
        ...args_0,
        collectionConfig
      });
    }
  }, [onDuplicateFromProps, collectionConfig, getDocumentView]);
  const onDelete = useCallback(args_1 => {
    if (typeof onDeleteFromProps === 'function') {
      void onDeleteFromProps({
        ...args_1,
        collectionConfig
      });
    }
    closeModal(drawerSlug);
  }, [onDeleteFromProps, closeModal, drawerSlug, collectionConfig]);
  const clearDoc = useCallback(() => {
    getDocumentView(undefined, true);
  }, [getDocumentView]);
  useEffect(() => {
    if (!DocumentView && !hasInitialized.current) {
      getDocumentView(docID, true);
      hasInitialized.current = true;
    }
  }, [DocumentView, getDocumentView, docID]);
  // Cleanup any pending requests when the component unmounts
  useEffect(() => {
    const abortGetDocumentView = abortGetDocumentViewRef.current;
    return () => {
      abortAndIgnore(abortGetDocumentView);
    };
  }, []);
  if (isLoading) {
    return /*#__PURE__*/_jsx(LoadingOverlay, {});
  }
  return /*#__PURE__*/_jsx(DocumentDrawerContextProvider, {
    clearDoc: clearDoc,
    drawerSlug: drawerSlug,
    onDelete: onDelete,
    onDuplicate: onDuplicate,
    onSave: onSave,
    children: DocumentView
  });
};
//# sourceMappingURL=DrawerContent.js.map