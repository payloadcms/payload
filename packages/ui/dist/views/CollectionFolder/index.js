'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDndMonitor } from '@dnd-kit/core';
import { getTranslation } from '@payloadcms/translations';
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React, { Fragment } from 'react';
import { DefaultListViewTabs } from '../../elements/DefaultListViewTabs/index.js';
import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js';
import { ColoredFolderIcon } from '../../elements/FolderView/ColoredFolderIcon/index.js';
import { CurrentFolderActions } from '../../elements/FolderView/CurrentFolderActions/index.js';
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js';
import { SortByPill } from '../../elements/FolderView/SortByPill/index.js';
import { ToggleViewButtons } from '../../elements/FolderView/ToggleViewButtons/index.js';
import { Gutter } from '../../elements/Gutter/index.js';
import { ListHeader } from '../../elements/ListHeader/index.js';
import { ListBulkUploadButton, ListCreateNewDocInFolderButton } from '../../elements/ListHeader/TitleActions/index.js';
import { NoListResults } from '../../elements/NoListResults/index.js';
import { SearchBar } from '../../elements/SearchBar/index.js';
import { useStepNav } from '../../elements/StepNav/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { FolderProvider, useFolder } from '../../providers/Folders/index.js';
import { usePreferences } from '../../providers/Preferences/index.js';
import { useRouteCache } from '../../providers/RouteCache/index.js';
import './index.scss';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { useWindowInfo } from '../../providers/WindowInfo/index.js';
import { ListSelection } from './ListSelection/index.js';
const baseClass = 'collection-folder-list';
export function DefaultCollectionFolderView({
  allCollectionFolderSlugs: folderCollectionSlugs,
  allowCreateCollectionSlugs,
  baseFolderPath,
  breadcrumbs,
  documents,
  folderFieldName,
  folderID,
  FolderResultsComponent,
  search,
  sort,
  subfolders,
  ...restOfProps
}) {
  return /*#__PURE__*/_jsx(FolderProvider, {
    allCollectionFolderSlugs: folderCollectionSlugs,
    allowCreateCollectionSlugs: allowCreateCollectionSlugs,
    baseFolderPath: baseFolderPath,
    breadcrumbs: breadcrumbs,
    documents: documents,
    folderFieldName: folderFieldName,
    folderID: folderID,
    FolderResultsComponent: FolderResultsComponent,
    search: search,
    sort: sort,
    subfolders: subfolders,
    children: /*#__PURE__*/_jsx(CollectionFolderViewInContext, {
      ...restOfProps
    })
  });
}
function CollectionFolderViewInContext(props) {
  const $ = _c(6);
  const {
    AfterFolderList,
    AfterFolderListTable,
    BeforeFolderList,
    BeforeFolderListTable,
    collectionSlug,
    Description,
    disableBulkDelete,
    disableBulkEdit,
    search,
    viewPreference
  } = props;
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    i18n,
    t
  } = useTranslation();
  const drawerDepth = useEditDepth();
  const {
    setStepNav
  } = useStepNav();
  const {
    setPreference
  } = usePreferences();
  const {
    allowCreateCollectionSlugs,
    breadcrumbs,
    documents,
    dragOverlayItem,
    folderCollectionConfig,
    folderCollectionSlug,
    FolderResultsComponent,
    folderType,
    getSelectedItems,
    moveToFolder,
    refineFolderData,
    selectedItemKeys,
    setIsDragging,
    subfolders
  } = useFolder();
  const router = useRouter();
  const {
    startRouteTransition
  } = useRouteTransition();
  const {
    clearRouteCache
  } = useRouteCache();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  const {
    labels,
    upload
  } = collectionConfig;
  const isUploadCollection = Boolean(upload);
  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload;
  const {
    breakpoints: t0
  } = useWindowInfo();
  const {
    s: smallBreak
  } = t0;
  let t1;
  if ($[0] !== clearRouteCache || $[1] !== getSelectedItems || $[2] !== moveToFolder) {
    t1 = async event => {
      if (!event.over) {
        return;
      }
      if (event.over.data.current.type === "folder" && "id" in event.over.data.current) {
        ;
        try {
          await moveToFolder({
            itemsToMove: getSelectedItems(),
            toFolderID: event.over.data.current.id
          });
        } catch (t2) {
          const error = t2;
          console.error("Error moving items:", error);
        }
        clearRouteCache();
      }
    };
    $[0] = clearRouteCache;
    $[1] = getSelectedItems;
    $[2] = moveToFolder;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const onDragEnd = t1;
  const handleSetViewType = async view => {
    await setPreference(`${collectionSlug}-collection-folder`, {
      viewPreference: view
    });
    clearRouteCache();
  };
  React.useEffect(() => {
    if (!drawerDepth) {
      setStepNav([!breadcrumbs.length ? {
        label: _jsxs("div", {
          className: `${baseClass}__step-nav-icon-label`,
          children: [_jsx(ColoredFolderIcon, {}), getTranslation(labels?.plural, i18n)]
        }, "root")
      } : {
        label: _jsxs(DroppableBreadcrumb, {
          className: [`${baseClass}__step-nav-droppable`, `${baseClass}__step-nav-icon-label`].filter(Boolean).join(" "),
          id: null,
          onClick: () => {
            startRouteTransition(() => {
              if (config.folders) {
                router.push(formatAdminURL({
                  adminRoute: config.routes.admin,
                  path: `/collections/${collectionSlug}/${config.folders.slug}`
                }));
              }
            });
          },
          children: [_jsx(ColoredFolderIcon, {}), getTranslation(labels?.plural, i18n)]
        }, "root")
      }, ...breadcrumbs.map((crumb, crumbIndex) => ({
        label: crumbIndex === breadcrumbs.length - 1 ? crumb.name : _jsx(DroppableBreadcrumb, {
          className: `${baseClass}__step-nav-droppable`,
          id: crumb.id,
          onClick: () => {
            startRouteTransition(() => {
              if (config.folders) {
                router.push(formatAdminURL({
                  adminRoute: config.routes.admin,
                  path: `/collections/${collectionSlug}/${config.folders.slug}/${crumb.id}`
                }));
              }
            });
          },
          children: crumb.name
        }, crumb.id)
      }))]);
    }
  }, [breadcrumbs, collectionSlug, config.folders, config.routes.admin, config.serverURL, drawerDepth, i18n, labels?.plural, router, setStepNav, startRouteTransition]);
  const totalDocsAndSubfolders = documents.length + subfolders.length;
  let t2;
  if ($[4] !== refineFolderData) {
    t2 = search_0 => refineFolderData({
      query: {
        search: search_0
      },
      updateURL: true
    });
    $[4] = refineFolderData;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return _jsxs(Fragment, {
    children: [_jsx(DndEventListener, {
      onDragEnd,
      setIsDragging
    }), _jsxs("div", {
      className: `${baseClass} ${baseClass}--${collectionSlug}`,
      children: [BeforeFolderList, _jsxs(Gutter, {
        className: `${baseClass}__wrap`,
        children: [_jsx(ListHeader, {
          Actions: [!smallBreak && _jsx(ListSelection, {
            disableBulkDelete,
            disableBulkEdit: collectionConfig.disableBulkEdit ?? disableBulkEdit,
            folderAssignedCollections: Array.isArray(folderType) ? folderType : [collectionSlug]
          }, "list-selection"), _jsx(DefaultListViewTabs, {
            collectionConfig,
            config,
            viewType: "folders"
          }, "default-list-actions")].filter(Boolean),
          AfterListHeaderContent: Description,
          title: getTranslation(labels?.plural, i18n),
          TitleActions: [allowCreateCollectionSlugs.length && _jsx(ListCreateNewDocInFolderButton, {
            buttonLabel: allowCreateCollectionSlugs.length > 1 ? t("general:createNew") : `${t("general:create")} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`,
            collectionSlugs: allowCreateCollectionSlugs,
            folderAssignedCollections: Array.isArray(folderType) ? folderType : [collectionSlug],
            onCreateSuccess: clearRouteCache,
            slugPrefix: "create-document--header-pill"
          }, "create-new-button"), _jsx(ListBulkUploadButton, {
            collectionSlug,
            hasCreatePermission: allowCreateCollectionSlugs.includes(collectionSlug),
            isBulkUploadEnabled
          }, "bulk-upload-button")].filter(Boolean)
        }), _jsx(SearchBar, {
          Actions: [_jsx(SortByPill, {}, "sort-by-pill"), _jsx(ToggleViewButtons, {
            activeView: viewPreference,
            setActiveView: handleSetViewType
          }, "toggle-view-buttons"), _jsx(CurrentFolderActions, {}, "current-folder-actions")].filter(Boolean),
          label: t("general:searchBy", {
            label: t("general:name")
          }),
          onSearchChange: t2,
          searchQueryParam: search
        }), BeforeFolderListTable, totalDocsAndSubfolders > 0 && FolderResultsComponent, totalDocsAndSubfolders === 0 && _jsx(NoListResults, {
          Actions: [allowCreateCollectionSlugs.includes(folderCollectionSlug) && _jsx(ListCreateNewDocInFolderButton, {
            buttonLabel: `${t("general:create")} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`,
            collectionSlugs: [folderCollectionConfig.slug],
            folderAssignedCollections: Array.isArray(folderType) ? folderType : [collectionSlug],
            onCreateSuccess: clearRouteCache,
            slugPrefix: "create-folder--no-results"
          }, "create-folder"), allowCreateCollectionSlugs.includes(collectionSlug) && _jsx(ListCreateNewDocInFolderButton, {
            buttonLabel: `${t("general:create")} ${t("general:document").toLowerCase()}`,
            collectionSlugs: [collectionSlug],
            folderAssignedCollections: Array.isArray(folderType) ? folderType : [collectionSlug],
            onCreateSuccess: clearRouteCache,
            slugPrefix: "create-document--no-results"
          }, "create-document")].filter(Boolean),
          Message: _jsx("p", {
            children: i18n.t("general:noResults", {
              label: `${getTranslation(labels?.plural, i18n)} ${t("general:or").toLowerCase()} ${getTranslation(folderCollectionConfig.labels?.plural, i18n)}`
            })
          })
        }), AfterFolderListTable]
      }), AfterFolderList]
    }), selectedItemKeys.size > 0 && dragOverlayItem && _jsx(DragOverlaySelection, {
      item: dragOverlayItem,
      selectedCount: selectedItemKeys.size
    })]
  });
}
function DndEventListener(t0) {
  const $ = _c(3);
  const {
    onDragEnd,
    setIsDragging
  } = t0;
  let t1;
  if ($[0] !== onDragEnd || $[1] !== setIsDragging) {
    t1 = {
      onDragCancel() {
        setIsDragging(false);
      },
      onDragEnd(event) {
        setIsDragging(false);
        onDragEnd(event);
      },
      onDragStart() {
        setIsDragging(true);
      }
    };
    $[0] = onDragEnd;
    $[1] = setIsDragging;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  useDndMonitor(t1);
  return null;
}
//# sourceMappingURL=index.js.map