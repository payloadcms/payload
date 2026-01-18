'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useRouter, useSearchParams } from 'next/navigation.js';
import { extractID, formatAdminURL, formatFolderOrDocumentItem } from 'payload/shared';
import * as qs from 'qs-esm';
import React from 'react';
import { toast } from 'sonner';
import { useDrawerDepth } from '../../elements/Drawer/index.js';
import { parseSearchParams } from '../../utilities/parseSearchParams.js';
import { useConfig } from '../Config/index.js';
import { useLocale } from '../Locale/index.js';
import { useRouteTransition } from '../RouteTransition/index.js';
import { useTranslation } from '../Translation/index.js';
import { groupItemIDsByRelation } from './groupItemIDsByRelation.js';
const Context = /*#__PURE__*/React.createContext({
  activeCollectionFolderSlugs: [],
  allCollectionFolderSlugs: [],
  allowCreateCollectionSlugs: [],
  breadcrumbs: [],
  checkIfItemIsDisabled: () => false,
  clearSelections: () => {},
  currentFolder: null,
  documents: [],
  dragOverlayItem: undefined,
  focusedRowIndex: -1,
  folderCollectionConfig: null,
  folderCollectionSlug: '',
  folderFieldName: 'folder',
  folderID: undefined,
  FolderResultsComponent: null,
  folderType: undefined,
  getFolderRoute: () => '',
  getSelectedItems: () => [],
  isDragging: false,
  itemKeysToMove: undefined,
  moveToFolder: () => Promise.resolve(undefined),
  onItemClick: () => undefined,
  onItemKeyPress: () => undefined,
  refineFolderData: () => undefined,
  search: '',
  selectedFolderCollections: undefined,
  selectedItemKeys: new Set(),
  setBreadcrumbs: () => {},
  setFocusedRowIndex: () => -1,
  setIsDragging: () => false,
  sort: 'name',
  subfolders: []
});
export function FolderProvider({
  activeCollectionFolderSlugs: activeCollectionSlugs,
  allCollectionFolderSlugs = [],
  allowCreateCollectionSlugs,
  allowMultiSelection = true,
  baseFolderPath,
  breadcrumbs: _breadcrumbsFromProps = [],
  children,
  documents,
  folderFieldName,
  folderID,
  FolderResultsComponent: InitialFolderResultsComponent,
  onItemClick: onItemClickFromProps,
  search,
  sort = 'name',
  subfolders
}) {
  const parentFolderContext = useFolder();
  const {
    config
  } = useConfig();
  const {
    routes
  } = config;
  const drawerDepth = useDrawerDepth();
  const {
    t
  } = useTranslation();
  const router = useRouter();
  const {
    startRouteTransition
  } = useRouteTransition();
  const locale = useLocale();
  const localeCode = locale ? locale.code : undefined;
  const currentlySelectedIndexes = React.useRef(new Set());
  const [selectedFolderCollections, setSelectedFolderCollections] = React.useState([]);
  const [FolderResultsComponent, setFolderResultsComponent] = React.useState(InitialFolderResultsComponent || (() => null));
  const [folderCollectionConfig] = React.useState(() => config.collections.find(collection => config.folders && collection.slug === config.folders.slug));
  const folderCollectionSlug = folderCollectionConfig.slug;
  const rawSearchParams = useSearchParams();
  const searchParams = React.useMemo(() => parseSearchParams(rawSearchParams), [rawSearchParams]);
  const [currentQuery, setCurrentQuery] = React.useState(searchParams);
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedItemKeys, setSelectedItemKeys] = React.useState(() => new Set());
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1);
  // This is used to determine what data to display on the drag overlay
  const [dragOverlayItem, setDragOverlayItem] = React.useState();
  const [breadcrumbs, setBreadcrumbs] = React.useState(_breadcrumbsFromProps);
  const lastClickTime = React.useRef(null);
  const totalCount = subfolders.length + documents.length;
  const clearSelections = React.useCallback(() => {
    setFocusedRowIndex(-1);
    setSelectedItemKeys(new Set());
    setDragOverlayItem(undefined);
    currentlySelectedIndexes.current = new Set();
  }, []);
  const mergeQuery = React.useCallback((newQuery = {}) => {
    let page = 'page' in newQuery ? newQuery.page : currentQuery?.page;
    if ('search' in newQuery) {
      page = '1';
    }
    const mergedQuery = {
      ...currentQuery,
      ...newQuery,
      locale: localeCode,
      page,
      relationTo: 'relationTo' in newQuery ? newQuery.relationTo : currentQuery?.relationTo,
      search: 'search' in newQuery ? newQuery.search : currentQuery?.search,
      sort: 'sort' in newQuery ? newQuery.sort : currentQuery?.sort ?? undefined
    };
    return mergedQuery;
  }, [currentQuery, localeCode]);
  const refineFolderData = React.useCallback(({
    query,
    updateURL
  }) => {
    if (updateURL) {
      const queryParams = mergeQuery(query);
      startRouteTransition(() => router.replace(`${qs.stringify({
        ...queryParams,
        relationTo: JSON.stringify(queryParams.relationTo)
      }, {
        addQueryPrefix: true
      })}`));
      setCurrentQuery(queryParams);
    }
  }, [mergeQuery, router, startRouteTransition]);
  const getFolderRoute = React.useCallback(toFolderID => {
    const queryParams_0 = qs.stringify(mergeQuery({
      page: '1',
      search: ''
    }), {
      addQueryPrefix: true
    });
    return formatAdminURL({
      adminRoute: config.routes.admin,
      path: `${baseFolderPath}${toFolderID ? `/${toFolderID}` : ''}${queryParams_0}`
    });
  }, [baseFolderPath, config.routes.admin, mergeQuery]);
  const getItem = React.useCallback(itemKey => {
    return [...subfolders, ...documents].find(doc => doc.itemKey === itemKey);
  }, [documents, subfolders]);
  const getSelectedItems = React.useCallback(() => {
    return Array.from(selectedItemKeys).reduce((acc, itemKey_0) => {
      const item = getItem(itemKey_0);
      if (item) {
        acc.push(item);
      }
      return acc;
    }, []);
  }, [selectedItemKeys, getItem]);
  const navigateAfterSelection = React.useCallback(({
    collectionSlug,
    docID
  }) => {
    if (drawerDepth === 1) {
      // not in a drawer (default is 1)
      if (collectionSlug === folderCollectionSlug) {
        // clicked on folder, take the user to the folder view
        startRouteTransition(() => {
          router.push(getFolderRoute(docID));
          clearSelections();
        });
      } else if (collectionSlug) {
        // clicked on document, take the user to the documet view
        startRouteTransition(() => {
          router.push(formatAdminURL({
            adminRoute: config.routes.admin,
            path: `/collections/${collectionSlug}/${docID}`
          }));
          clearSelections();
        });
      }
    } else {
      clearSelections();
    }
    if (typeof onItemClickFromProps === 'function') {
      onItemClickFromProps(getItem(`${collectionSlug}-${docID}`));
    }
  }, [clearSelections, config.routes.admin, drawerDepth, folderCollectionSlug, getFolderRoute, getItem, onItemClickFromProps, router, startRouteTransition]);
  const handleShiftSelection = React.useCallback(targetIndex => {
    const allItems = [...subfolders, ...documents];
    // Find existing selection boundaries
    const existingIndexes = allItems.reduce((acc_0, item_0, idx) => {
      if (selectedItemKeys.has(item_0.itemKey)) {
        acc_0.push(idx);
      }
      return acc_0;
    }, []);
    if (existingIndexes.length === 0) {
      // No existing selection, just select target
      return [targetIndex];
    }
    const firstSelectedIndex = Math.min(...existingIndexes);
    const lastSelectedIndex = Math.max(...existingIndexes);
    const isWithinBounds = targetIndex >= firstSelectedIndex && targetIndex <= lastSelectedIndex;
    // Choose anchor based on whether we're contracting or extending
    let anchorIndex = targetIndex;
    if (isWithinBounds) {
      // Contracting: if target is at a boundary, use target as anchor
      // Otherwise, use furthest boundary to maintain opposite edge
      if (targetIndex === firstSelectedIndex || targetIndex === lastSelectedIndex) {
        anchorIndex = targetIndex;
      } else {
        const distanceToFirst = Math.abs(targetIndex - firstSelectedIndex);
        const distanceToLast = Math.abs(targetIndex - lastSelectedIndex);
        anchorIndex = distanceToFirst >= distanceToLast ? firstSelectedIndex : lastSelectedIndex;
      }
    } else {
      // Extending: use closest boundary
      const distanceToFirst_0 = Math.abs(targetIndex - firstSelectedIndex);
      const distanceToLast_0 = Math.abs(targetIndex - lastSelectedIndex);
      anchorIndex = distanceToFirst_0 <= distanceToLast_0 ? firstSelectedIndex : lastSelectedIndex;
    }
    // Create range from anchor to target
    const startIndex = Math.min(anchorIndex, targetIndex);
    const endIndex = Math.max(anchorIndex, targetIndex);
    const newRangeIndexes = Array.from({
      length: endIndex - startIndex + 1
    }, (_, i) => startIndex + i);
    if (isWithinBounds) {
      // Contracting: replace with new range
      return newRangeIndexes;
    } else {
      // Extending: union with existing
      return [...new Set([...existingIndexes, ...newRangeIndexes])];
    }
  }, [subfolders, documents, selectedItemKeys]);
  const updateSelections = React.useCallback(({
    indexes
  }) => {
    const allItems_0 = [...subfolders, ...documents];
    const {
      newSelectedFolderCollections,
      newSelectedItemKeys
    } = allItems_0.reduce((acc_1, item_1, index) => {
      if (indexes.includes(index)) {
        acc_1.newSelectedItemKeys.add(item_1.itemKey);
        if (item_1.relationTo === folderCollectionSlug) {
          item_1.value.folderType?.forEach(collectionSlug_0 => {
            if (!acc_1.newSelectedFolderCollections.includes(collectionSlug_0)) {
              acc_1.newSelectedFolderCollections.push(collectionSlug_0);
            }
          });
        } else {
          if (!acc_1.newSelectedFolderCollections.includes(item_1.relationTo)) {
            acc_1.newSelectedFolderCollections.push(item_1.relationTo);
          }
        }
      }
      return acc_1;
    }, {
      newSelectedFolderCollections: [],
      newSelectedItemKeys: new Set()
    });
    setSelectedFolderCollections(newSelectedFolderCollections);
    setSelectedItemKeys(newSelectedItemKeys);
  }, [documents, folderCollectionSlug, subfolders]);
  const onItemKeyPress = React.useCallback(({
    event,
    item: currentItem
  }) => {
    const {
      code,
      ctrlKey,
      metaKey,
      shiftKey
    } = event;
    const isShiftPressed = shiftKey;
    const isCtrlPressed = ctrlKey || metaKey;
    const isCurrentlySelected = selectedItemKeys.has(currentItem.itemKey);
    const allItems_1 = [...subfolders, ...documents];
    const currentItemIndex = allItems_1.findIndex(item_2 => item_2.itemKey === currentItem.itemKey);
    switch (code) {
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
        {
          event.preventDefault();
          if (currentItemIndex === -1) {
            break;
          }
          const isBackward = code === 'ArrowLeft' || code === 'ArrowUp';
          const newItemIndex = isBackward ? currentItemIndex - 1 : currentItemIndex + 1;
          if (newItemIndex < 0 || newItemIndex > totalCount - 1) {
            // out of bounds, keep current selection
            return;
          }
          setFocusedRowIndex(newItemIndex);
          if (isCtrlPressed) {
            break;
          }
          if (isShiftPressed && allowMultiSelection) {
            const selectedIndexes = handleShiftSelection(newItemIndex);
            updateSelections({
              indexes: selectedIndexes
            });
            return;
          }
          // Single selection without shift
          if (!isShiftPressed) {
            const newItem = allItems_1[newItemIndex];
            setSelectedItemKeys(new Set([newItem.itemKey]));
          }
          break;
        }
      case 'Enter':
        {
          if (selectedItemKeys.size === 1) {
            setFocusedRowIndex(undefined);
            navigateAfterSelection({
              collectionSlug: currentItem.relationTo,
              docID: extractID(currentItem.value)
            });
            return;
          }
          break;
        }
      case 'Escape':
        {
          clearSelections();
          break;
        }
      case 'KeyA':
        {
          if (allowMultiSelection && isCtrlPressed) {
            event.preventDefault();
            setFocusedRowIndex(totalCount - 1);
            updateSelections({
              indexes: Array.from({
                length: totalCount
              }, (__0, i_0) => i_0)
            });
          }
          break;
        }
      case 'Space':
        {
          if (allowMultiSelection && isShiftPressed) {
            event.preventDefault();
            const allItems_2 = [...subfolders, ...documents];
            updateSelections({
              indexes: allItems_2.reduce((acc_2, item_3, idx_0) => {
                if (item_3.itemKey === currentItem.itemKey) {
                  if (isCurrentlySelected) {
                    return acc_2;
                  } else {
                    acc_2.push(idx_0);
                  }
                } else if (selectedItemKeys.has(item_3.itemKey)) {
                  acc_2.push(idx_0);
                }
                return acc_2;
              }, [])
            });
          } else {
            event.preventDefault();
            updateSelections({
              indexes: isCurrentlySelected ? [] : [currentItemIndex]
            });
          }
          break;
        }
      case 'Tab':
        {
          if (allowMultiSelection && isShiftPressed) {
            const prevIndex = currentItemIndex - 1;
            if (prevIndex < 0 && selectedItemKeys?.size > 0) {
              setFocusedRowIndex(prevIndex);
            }
          } else {
            const nextIndex = currentItemIndex + 1;
            if (nextIndex === totalCount && selectedItemKeys.size > 0) {
              setFocusedRowIndex(totalCount - 1);
            }
          }
          break;
        }
    }
  }, [selectedItemKeys, subfolders, documents, allowMultiSelection, handleShiftSelection, updateSelections, navigateAfterSelection, clearSelections, totalCount]);
  const onItemClick = React.useCallback(({
    event: event_0,
    item: clickedItem
  }) => {
    let doubleClicked = false;
    const isCtrlPressed_0 = event_0.ctrlKey || event_0.metaKey;
    const isShiftPressed_0 = event_0.shiftKey;
    const isCurrentlySelected_0 = selectedItemKeys.has(clickedItem.itemKey);
    const allItems_3 = [...subfolders, ...documents];
    const currentItemIndex_0 = allItems_3.findIndex(item_4 => item_4.itemKey === clickedItem.itemKey);
    if (allowMultiSelection && isCtrlPressed_0) {
      event_0.preventDefault();
      let overlayItemKey;
      const indexes_0 = allItems_3.reduce((acc_3, item_5, idx_1) => {
        if (item_5.itemKey === clickedItem.itemKey) {
          if (isCurrentlySelected_0 && event_0.type !== 'pointermove') {
            return acc_3;
          } else {
            acc_3.push(idx_1);
            overlayItemKey = item_5.itemKey;
          }
        } else if (selectedItemKeys.has(item_5.itemKey)) {
          acc_3.push(idx_1);
        }
        return acc_3;
      }, []);
      updateSelections({
        indexes: indexes_0
      });
      if (overlayItemKey) {
        setDragOverlayItem(getItem(overlayItemKey));
      }
    } else if (allowMultiSelection && isShiftPressed_0) {
      if (currentItemIndex_0 !== -1) {
        const selectedIndexes_0 = handleShiftSelection(currentItemIndex_0);
        updateSelections({
          indexes: selectedIndexes_0
        });
      }
    } else if (allowMultiSelection && event_0.type === 'pointermove') {
      // on drag start of an unselected item
      if (!isCurrentlySelected_0) {
        updateSelections({
          indexes: allItems_3.reduce((acc_4, item_6, idx_2) => {
            if (item_6.itemKey === clickedItem.itemKey) {
              acc_4.push(idx_2);
            }
            return acc_4;
          }, [])
        });
      }
      setDragOverlayItem(getItem(clickedItem.itemKey));
    } else {
      // Normal click - select single item
      const now = Date.now();
      doubleClicked = now - lastClickTime.current < 400 && dragOverlayItem?.itemKey === clickedItem.itemKey;
      lastClickTime.current = now;
      if (!doubleClicked) {
        updateSelections({
          indexes: isCurrentlySelected_0 && selectedItemKeys.size === 1 ? [] : [currentItemIndex_0]
        });
      }
      setDragOverlayItem(getItem(clickedItem.itemKey));
    }
    if (doubleClicked) {
      navigateAfterSelection({
        collectionSlug: clickedItem.relationTo,
        docID: extractID(clickedItem.value)
      });
    }
  }, [selectedItemKeys, subfolders, documents, allowMultiSelection, dragOverlayItem, getItem, updateSelections, navigateAfterSelection, handleShiftSelection]);
  /**
  * Makes requests to the server to update the folder field on passed in documents
  *
  * Might rewrite this in the future to return the promises so errors can be handled contextually
  */
  const moveToFolder = React.useCallback(async args => {
    const {
      itemsToMove: items,
      toFolderID: toFolderID_0
    } = args;
    if (!items.length) {
      return;
    }
    const movingCurrentFolder = items.length === 1 && items[0].relationTo === folderCollectionSlug && items[0].value.id === folderID;
    if (movingCurrentFolder) {
      const queryParams_1 = qs.stringify({
        depth: 0,
        locale: localeCode
      }, {
        addQueryPrefix: true
      });
      const req = await fetch(formatAdminURL({
        apiRoute: routes.api,
        path: `/${folderCollectionSlug}/${folderID}${queryParams_1}`
      }), {
        body: JSON.stringify({
          [folderFieldName]: toFolderID_0 || null
        }),
        credentials: 'include',
        headers: {
          'content-type': 'application/json'
        },
        method: 'PATCH'
      });
      if (req.status !== 200) {
        toast.error(t('general:error'));
      }
    } else {
      for (const [collectionSlug_1, ids] of Object.entries(groupItemIDsByRelation(items))) {
        const queryParams_2 = qs.stringify({
          depth: 0,
          limit: 0,
          locale: localeCode,
          where: {
            id: {
              in: ids
            }
          }
        }, {
          addQueryPrefix: true
        });
        try {
          await fetch(formatAdminURL({
            apiRoute: routes.api,
            path: `/${collectionSlug_1}${queryParams_2}`
          }), {
            body: JSON.stringify({
              [folderFieldName]: toFolderID_0 || null
            }),
            credentials: 'include',
            headers: {
              'content-type': 'application/json'
            },
            method: 'PATCH'
          });
        } catch (error) {
          toast.error(t('general:error'));
          // eslint-disable-next-line no-console
          console.error(error);
          continue;
        }
      }
    }
    clearSelections();
  }, [folderID, clearSelections, folderCollectionSlug, folderFieldName, routes.api, t, localeCode]);
  const checkIfItemIsDisabled = React.useCallback(item_7 => {
    function folderAcceptsItem({
      item: item_8,
      selectedFolderCollections: selectedFolderCollections_0
    }) {
      if (!item_8.value.folderType || Array.isArray(item_8.value.folderType) && item_8.value.folderType.length === 0) {
        // Enable folder that accept all collections
        return false;
      }
      if (selectedFolderCollections_0.length === 0) {
        // If no collections are selected, enable folders that accept all collections
        return Boolean(item_8.value.folderType || item_8.value.folderType.length > 0);
      }
      // Disable folders that do not accept all of the selected collections
      return selectedFolderCollections_0.some(slug => {
        return !item_8.value.folderType.includes(slug);
      });
    }
    if (isDragging) {
      const isSelected = selectedItemKeys.has(item_7.itemKey);
      if (isSelected) {
        return true;
      } else if (item_7.relationTo === folderCollectionSlug) {
        return folderAcceptsItem({
          item: item_7,
          selectedFolderCollections
        });
      } else {
        // Non folder items are disabled on drag
        return true;
      }
    } else if (parentFolderContext?.selectedItemKeys?.size) {
      // Disable selected items from being navigated to in move to drawer
      if (parentFolderContext.selectedItemKeys.has(item_7.itemKey)) {
        return true;
      }
      // Moving items to folder
      if (item_7.relationTo === folderCollectionSlug) {
        return folderAcceptsItem({
          item: item_7,
          selectedFolderCollections: parentFolderContext.selectedFolderCollections
        });
      }
      // If the item is not a folder, it is disabled on move
      return true;
    }
  }, [selectedFolderCollections, isDragging, selectedItemKeys, folderCollectionSlug, parentFolderContext?.selectedFolderCollections, parentFolderContext?.selectedItemKeys]);
  // If a new component is provided, update the state so children can re-render with the new component
  React.useEffect(() => {
    if (InitialFolderResultsComponent) {
      setFolderResultsComponent(InitialFolderResultsComponent);
    }
  }, [InitialFolderResultsComponent]);
  return /*#__PURE__*/_jsx(Context, {
    value: {
      activeCollectionFolderSlugs: activeCollectionSlugs || allCollectionFolderSlugs,
      allCollectionFolderSlugs,
      allowCreateCollectionSlugs,
      breadcrumbs,
      checkIfItemIsDisabled,
      clearSelections,
      currentFolder: breadcrumbs?.[breadcrumbs.length - 1]?.id !== undefined ? formatFolderOrDocumentItem({
        folderFieldName,
        isUpload: false,
        relationTo: folderCollectionSlug,
        useAsTitle: folderCollectionConfig.admin.useAsTitle,
        value: breadcrumbs[breadcrumbs.length - 1]
      }) : null,
      documents,
      dragOverlayItem,
      focusedRowIndex,
      folderCollectionConfig,
      folderCollectionSlug,
      folderFieldName,
      folderID,
      FolderResultsComponent,
      folderType: breadcrumbs?.[breadcrumbs.length - 1]?.folderType,
      getFolderRoute,
      getSelectedItems,
      isDragging,
      itemKeysToMove: parentFolderContext.selectedItemKeys,
      moveToFolder,
      onItemClick,
      onItemKeyPress,
      refineFolderData,
      search,
      selectedFolderCollections,
      selectedItemKeys,
      setBreadcrumbs,
      setFocusedRowIndex,
      setIsDragging,
      sort,
      subfolders
    },
    children: children
  });
}
export function useFolder() {
  const context = React.use(Context);
  if (context === undefined) {
    throw new Error('useFolder must be used within a FolderProvider');
  }
  return context;
}
//# sourceMappingURL=index.js.map