'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { hoistQueryParamsToAnd } from 'payload/shared';
import React, { useCallback, useEffect, useState } from 'react';
import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
import { useConfig } from '../../providers/Config/index.js';
import { useServerFunctions } from '../../providers/ServerFunctions/index.js';
import { ListDrawerContextProvider } from '../ListDrawer/Provider.js';
import { LoadingOverlay } from '../Loading/index.js';
export const ListDrawerContent = ({
  allowCreate = true,
  collectionSlugs,
  disableQueryPresets,
  drawerSlug,
  enableRowSelections,
  filterOptions,
  onBulkSelect,
  onSelect,
  overrideEntityVisibility = true,
  selectedCollection: collectionSlugFromProps
}) => {
  const {
    closeModal,
    isModalOpen
  } = useModal();
  const {
    serverFunction
  } = useServerFunctions();
  const [ListView, setListView] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const {
    config: {
      collections
    },
    getEntityConfig
  } = useConfig();
  const isOpen = isModalOpen(drawerSlug);
  const enabledCollections = collections.filter(({
    slug
  }) => {
    return collectionSlugs.includes(slug);
  });
  const [selectedOption, setSelectedOption] = useState(() => {
    const initialSelection = collectionSlugFromProps || enabledCollections[0]?.slug;
    const found = getEntityConfig({
      collectionSlug: initialSelection
    });
    return found ? {
      label: found.labels,
      value: found.slug
    } : undefined;
  });
  const [DocumentDrawer, DocumentDrawerToggler, {
    drawerSlug: documentDrawerSlug
  }] = useDocumentDrawer({
    collectionSlug: selectedOption.value
  });
  const updateSelectedOption = useEffectEvent(collectionSlug => {
    if (collectionSlug && collectionSlug !== selectedOption?.value) {
      setSelectedOption({
        label: getEntityConfig({
          collectionSlug
        })?.labels,
        value: collectionSlug
      });
    }
  });
  useEffect(() => {
    updateSelectedOption(collectionSlugFromProps);
  }, [collectionSlugFromProps]);
  /**
  * This performs a full server round trip to get the list view for the selected collection.
  * On the server, the data is freshly queried for the list view and all components are fully rendered.
  * This work includes building column state, rendering custom components, etc.
  */
  const refresh = useCallback(async ({
    slug: slug_0,
    query
  }) => {
    try {
      const newQuery = {
        ...(query || {}),
        where: {
          ...(query?.where || {})
        }
      };
      const filterOption = filterOptions?.[slug_0];
      if (filterOptions && typeof filterOption !== 'boolean') {
        newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOption);
      }
      if (slug_0) {
        const result = await serverFunction({
          name: 'render-list',
          args: {
            collectionSlug: slug_0,
            disableBulkDelete: true,
            disableBulkEdit: true,
            disableQueryPresets,
            drawerSlug,
            enableRowSelections,
            overrideEntityVisibility,
            query: newQuery
          }
        });
        setListView(result?.List || null);
      } else {
        setListView(null);
      }
      setIsLoading(false);
    } catch (_err) {
      console.error('Error rendering List View: ', _err); // eslint-disable-line no-console
      if (isOpen) {
        closeModal(drawerSlug);
      }
    }
  }, [serverFunction, closeModal, drawerSlug, isOpen, enableRowSelections, filterOptions, overrideEntityVisibility, disableQueryPresets]);
  useEffect(() => {
    if (!ListView) {
      void refresh({
        slug: selectedOption?.value
      });
    }
  }, [refresh, ListView, selectedOption.value]);
  const onCreateNew = useCallback(({
    doc
  }) => {
    if (typeof onSelect === 'function') {
      onSelect({
        collectionSlug: selectedOption?.value,
        doc,
        docID: doc.id
      });
    }
    closeModal(documentDrawerSlug);
    closeModal(drawerSlug);
  }, [closeModal, documentDrawerSlug, drawerSlug, onSelect, selectedOption.value]);
  const onQueryChange = useCallback(query_0 => {
    void refresh({
      slug: selectedOption?.value,
      query: query_0
    });
  }, [refresh, selectedOption.value]);
  const setMySelectedOption = useCallback(incomingSelection => {
    setSelectedOption(incomingSelection);
    void refresh({
      slug: incomingSelection?.value
    });
  }, [refresh]);
  const refreshSelf = useCallback(async incomingCollectionSlug => {
    if (incomingCollectionSlug) {
      setSelectedOption({
        label: getEntityConfig({
          collectionSlug: incomingCollectionSlug
        })?.labels,
        value: incomingCollectionSlug
      });
    }
    await refresh({
      slug: selectedOption.value || incomingCollectionSlug
    });
  }, [getEntityConfig, refresh, selectedOption.value]);
  if (isLoading) {
    return /*#__PURE__*/_jsx(LoadingOverlay, {});
  }
  return /*#__PURE__*/_jsxs(ListDrawerContextProvider, {
    allowCreate: allowCreate,
    createNewDrawerSlug: documentDrawerSlug,
    DocumentDrawerToggler: DocumentDrawerToggler,
    drawerSlug: drawerSlug,
    enabledCollections: collectionSlugs,
    onBulkSelect: onBulkSelect,
    onQueryChange: onQueryChange,
    onSelect: onSelect,
    refresh: refreshSelf,
    selectedOption: selectedOption,
    setSelectedOption: setMySelectedOption,
    children: [ListView, /*#__PURE__*/_jsx(DocumentDrawer, {
      onSave: onCreateNew
    })]
  });
};
//# sourceMappingURL=DrawerContent.js.map