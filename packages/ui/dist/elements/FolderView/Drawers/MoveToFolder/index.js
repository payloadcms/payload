'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { extractID } from 'payload/shared';
import React from 'react';
import { useAuth } from '../../../../providers/Auth/index.js';
import { FolderProvider, useFolder } from '../../../../providers/Folders/index.js';
import { useRouteCache } from '../../../../providers/RouteCache/index.js';
import { useServerFunctions } from '../../../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { Button } from '../../../Button/index.js';
import { ConfirmationModal } from '../../../ConfirmationModal/index.js';
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js';
import { Drawer } from '../../../Drawer/index.js';
import { DrawerActionHeader } from '../../../DrawerActionHeader/index.js';
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js';
import { ListCreateNewDocInFolderButton } from '../../../ListHeader/TitleActions/ListCreateNewDocInFolderButton.js';
import { LoadingOverlay } from '../../../Loading/index.js';
import { NoListResults } from '../../../NoListResults/index.js';
import { Translation } from '../../../Translation/index.js';
import { FolderBreadcrumbs } from '../../Breadcrumbs/index.js';
import { ColoredFolderIcon } from '../../ColoredFolderIcon/index.js';
import './index.scss';
const baseClass = 'move-folder-drawer';
const baseModalSlug = 'move-folder-drawer';
const confirmModalSlug = `${baseModalSlug}-confirm-move`;
export function MoveItemsToFolderDrawer(props) {
  return /*#__PURE__*/_jsx(Drawer, {
    gutter: false,
    Header: null,
    slug: props.drawerSlug,
    children: /*#__PURE__*/_jsx(LoadFolderData, {
      ...props
    })
  });
}
function LoadFolderData(props) {
  const {
    permissions
  } = useAuth();
  const [subfolders, setSubfolders] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [breadcrumbs, setBreadcrumbs] = React.useState([]);
  const [FolderResultsComponent, setFolderResultsComponent] = React.useState(null);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [folderID, setFolderID] = React.useState(props.fromFolderID || null);
  const hasLoadedRef = React.useRef(false);
  const {
    getFolderResultsComponentAndData
  } = useServerFunctions();
  const populateMoveToFolderDrawer = React.useCallback(async folderIDToPopulate => {
    try {
      const result = await getFolderResultsComponentAndData({
        browseByFolder: false,
        collectionsToDisplay: [props.folderCollectionSlug],
        displayAs: 'grid',
        // todo: should be able to pass undefined, empty array or null and get all folders. Need to look at API for this in the server function
        folderAssignedCollections: props.folderAssignedCollections,
        folderID: folderIDToPopulate,
        sort: 'name'
      });
      setBreadcrumbs(result.breadcrumbs || []);
      setSubfolders(result?.subfolders || []);
      setDocuments(result?.documents || []);
      setFolderResultsComponent(result.FolderResultsComponent || null);
      setFolderID(folderIDToPopulate);
      setHasLoaded(true);
    } catch (e) {
      setBreadcrumbs([]);
      setSubfolders([]);
      setDocuments([]);
    }
    hasLoadedRef.current = true;
  }, [getFolderResultsComponentAndData, props.folderAssignedCollections, props.folderCollectionSlug]);
  React.useEffect(() => {
    if (!hasLoadedRef.current) {
      void populateMoveToFolderDrawer(props.fromFolderID);
    }
  }, [populateMoveToFolderDrawer, props.fromFolderID]);
  if (!hasLoaded) {
    return /*#__PURE__*/_jsx(LoadingOverlay, {});
  }
  return /*#__PURE__*/_jsx(FolderProvider, {
    allCollectionFolderSlugs: [props.folderCollectionSlug],
    allowCreateCollectionSlugs: permissions.collections[props.folderCollectionSlug]?.create ? [props.folderCollectionSlug] : [],
    allowMultiSelection: false,
    breadcrumbs: breadcrumbs,
    documents: documents,
    folderFieldName: props.folderFieldName,
    folderID: folderID,
    FolderResultsComponent: FolderResultsComponent,
    onItemClick: async item => {
      await populateMoveToFolderDrawer(item.value.id);
    },
    subfolders: subfolders,
    children: /*#__PURE__*/_jsx(Content, {
      ...props,
      populateMoveToFolderDrawer: populateMoveToFolderDrawer
    })
  }, folderID);
}
function Content(t0) {
  const $ = _c(34);
  const {
    drawerSlug,
    fromFolderID,
    fromFolderName,
    itemsToMove,
    onConfirm,
    populateMoveToFolderDrawer,
    skipConfirmModal,
    ...props
  } = t0;
  const {
    clearRouteCache
  } = useRouteCache();
  const {
    closeModal,
    isModalOpen,
    openModal
  } = useModal();
  let t1;
  if ($[0] !== itemsToMove) {
    t1 = () => itemsToMove.length;
    $[0] = itemsToMove;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [count] = React.useState(t1);
  const [folderAddedToUnderlyingFolder, setFolderAddedToUnderlyingFolder] = React.useState(false);
  const {
    i18n,
    t
  } = useTranslation();
  const {
    breadcrumbs,
    folderCollectionConfig,
    folderCollectionSlug,
    folderFieldName,
    folderID,
    FolderResultsComponent,
    folderType,
    getSelectedItems,
    subfolders
  } = useFolder();
  let t2;
  if ($[2] !== folderCollectionSlug) {
    t2 = {
      collectionSlug: folderCollectionSlug
    };
    $[2] = folderCollectionSlug;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const [FolderDocumentDrawer,, t3] = useDocumentDrawer(t2);
  const {
    closeDrawer: closeFolderDrawer,
    openDrawer: openFolderDrawer
  } = t3;
  let t4;
  if ($[4] !== breadcrumbs || $[5] !== getSelectedItems) {
    t4 = () => {
      const selected = getSelectedItems();
      if (selected.length === 0) {
        const lastCrumb = breadcrumbs?.[breadcrumbs.length - 1];
        return {
          id: lastCrumb?.id || null,
          name: lastCrumb?.name || null
        };
      } else {
        return {
          id: selected[0].value.id,
          name: selected[0].value._folderOrDocumentTitle
        };
      }
    };
    $[4] = breadcrumbs;
    $[5] = getSelectedItems;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  const getSelectedFolder = t4;
  let t5;
  if ($[7] !== folderCollectionSlug || $[8] !== folderID || $[9] !== fromFolderID || $[10] !== populateMoveToFolderDrawer) {
    t5 = async t6 => {
      const {
        collectionSlug,
        doc
      } = t6;
      await populateMoveToFolderDrawer(folderID);
      if (collectionSlug === folderCollectionSlug && (doc?.folder && fromFolderID === extractID(doc?.folder) || !fromFolderID && !doc?.folder)) {
        setFolderAddedToUnderlyingFolder(true);
      }
    };
    $[7] = folderCollectionSlug;
    $[8] = folderID;
    $[9] = fromFolderID;
    $[10] = populateMoveToFolderDrawer;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  const onCreateSuccess = t5;
  let t6;
  if ($[12] !== getSelectedFolder || $[13] !== onConfirm) {
    t6 = () => {
      if (typeof onConfirm === "function") {
        onConfirm(getSelectedFolder());
      }
    };
    $[12] = getSelectedFolder;
    $[13] = onConfirm;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  const onConfirmMove = t6;
  let t7;
  let t8;
  if ($[15] !== clearRouteCache || $[16] !== drawerSlug || $[17] !== folderAddedToUnderlyingFolder || $[18] !== isModalOpen) {
    t7 = () => {
      if (!isModalOpen(drawerSlug) && folderAddedToUnderlyingFolder) {
        setFolderAddedToUnderlyingFolder(false);
        clearRouteCache();
      }
    };
    t8 = [drawerSlug, isModalOpen, clearRouteCache, folderAddedToUnderlyingFolder];
    $[15] = clearRouteCache;
    $[16] = drawerSlug;
    $[17] = folderAddedToUnderlyingFolder;
    $[18] = isModalOpen;
    $[19] = t7;
    $[20] = t8;
  } else {
    t7 = $[19];
    t8 = $[20];
  }
  React.useEffect(t7, t8);
  let t9;
  if ($[21] !== closeModal || $[22] !== drawerSlug) {
    t9 = () => {
      closeModal(drawerSlug);
    };
    $[21] = closeModal;
    $[22] = drawerSlug;
    $[23] = t9;
  } else {
    t9 = $[23];
  }
  let t10;
  if ($[24] !== onConfirmMove || $[25] !== openModal || $[26] !== skipConfirmModal) {
    t10 = () => {
      if (skipConfirmModal) {
        onConfirmMove();
      } else {
        openModal(confirmModalSlug);
      }
    };
    $[24] = onConfirmMove;
    $[25] = openModal;
    $[26] = skipConfirmModal;
    $[27] = t10;
  } else {
    t10 = $[27];
  }
  let t11;
  if ($[28] !== breadcrumbs.length || $[29] !== populateMoveToFolderDrawer) {
    t11 = breadcrumbs.length ? () => {
      populateMoveToFolderDrawer(null);
    } : undefined;
    $[28] = breadcrumbs.length;
    $[29] = populateMoveToFolderDrawer;
    $[30] = t11;
  } else {
    t11 = $[30];
  }
  let t12;
  if ($[31] !== breadcrumbs.length || $[32] !== populateMoveToFolderDrawer) {
    t12 = (crumb, index) => ({
      id: crumb.id,
      name: crumb.name,
      onClick: index !== breadcrumbs.length - 1 ? () => {
        populateMoveToFolderDrawer(crumb.id);
      } : undefined
    });
    $[31] = breadcrumbs.length;
    $[32] = populateMoveToFolderDrawer;
    $[33] = t12;
  } else {
    t12 = $[33];
  }
  return _jsxs("div", {
    className: baseClass,
    children: [_jsx(DrawerActionHeader, {
      onCancel: t9,
      onSave: t10,
      saveLabel: t("general:select"),
      title: _jsx(DrawerHeading, {
        action: props.action,
        count,
        fromFolderName: fromFolderID ? fromFolderName : undefined,
        title: props.action === "moveItemToFolder" ? props.title : undefined
      })
    }), _jsxs("div", {
      className: `${baseClass}__breadcrumbs-section`,
      children: [_jsx(FolderBreadcrumbs, {
        breadcrumbs: [{
          id: null,
          name: _jsxs("span", {
            className: `${baseClass}__folder-breadcrumbs-root`,
            children: [_jsx(ColoredFolderIcon, {}), t("folder:folders")]
          }),
          onClick: t11
        }, ...breadcrumbs.map(t12)]
      }), subfolders.length > 0 && _jsxs(_Fragment, {
        children: [_jsx(Button, {
          buttonStyle: "pill",
          className: `${baseClass}__add-folder-button`,
          margin: false,
          onClick: () => {
            openFolderDrawer();
          },
          children: t("fields:addLabel", {
            label: getTranslation(folderCollectionConfig.labels?.singular, i18n)
          })
        }), _jsx(FolderDocumentDrawer, {
          initialData: {
            [folderFieldName]: folderID,
            folderType
          },
          onSave: result => {
            onCreateSuccess({
              collectionSlug: folderCollectionConfig.slug,
              doc: result.doc
            });
            closeFolderDrawer();
          },
          redirectAfterCreate: false
        })]
      })]
    }), _jsx(DrawerContentContainer, {
      className: `${baseClass}__body-section`,
      children: subfolders.length > 0 ? FolderResultsComponent : _jsx(NoListResults, {
        Actions: [_jsx(ListCreateNewDocInFolderButton, {
          buttonLabel: `${t("general:create")} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`,
          collectionSlugs: [folderCollectionSlug],
          folderAssignedCollections: props.folderAssignedCollections,
          onCreateSuccess,
          slugPrefix: "create-new-folder-from-drawer--no-results"
        }, "create-folder")],
        Message: _jsx("p", {
          children: i18n.t("general:noResults", {
            label: `${getTranslation(folderCollectionConfig.labels?.plural, i18n)}`
          })
        })
      })
    }), !skipConfirmModal && _jsx(ConfirmationModal, {
      body: _jsx(ConfirmationMessage, {
        action: props.action,
        count,
        fromFolderName,
        title: props.action === "moveItemToFolder" ? props.title : undefined,
        toFolderName: getSelectedFolder().name
      }),
      confirmingLabel: t("general:moving"),
      confirmLabel: t("general:move"),
      heading: t("general:confirmMove"),
      modalSlug: confirmModalSlug,
      onConfirm: onConfirmMove
    })]
  });
}
function DrawerHeading(props) {
  const $ = _c(14);
  const {
    t
  } = useTranslation();
  switch (props.action) {
    case "moveItemToFolder":
      {
        if (props.fromFolderName) {
          let t0;
          if ($[0] !== props.fromFolderName || $[1] !== props.title || $[2] !== t) {
            t0 = t("folder:movingFromFolder", {
              fromFolder: props.fromFolderName,
              title: props.title
            });
            $[0] = props.fromFolderName;
            $[1] = props.title;
            $[2] = t;
            $[3] = t0;
          } else {
            t0 = $[3];
          }
          return t0;
        } else {
          let t0;
          if ($[4] !== props.title || $[5] !== t) {
            t0 = t("folder:selectFolderForItem", {
              title: props.title
            });
            $[4] = props.title;
            $[5] = t;
            $[6] = t0;
          } else {
            t0 = $[6];
          }
          return t0;
        }
      }
    case "moveItemsToFolder":
      {
        if (props.fromFolderName) {
          const t0 = `${props.count} ${props.count > 1 ? t("general:items") : t("general:item")}`;
          let t1;
          if ($[7] !== props.fromFolderName || $[8] !== t || $[9] !== t0) {
            t1 = t("folder:movingFromFolder", {
              fromFolder: props.fromFolderName,
              title: t0
            });
            $[7] = props.fromFolderName;
            $[8] = t;
            $[9] = t0;
            $[10] = t1;
          } else {
            t1 = $[10];
          }
          return t1;
        } else {
          const t0 = `${props.count} ${props.count > 1 ? t("general:items") : t("general:item")}`;
          let t1;
          if ($[11] !== t || $[12] !== t0) {
            t1 = t("folder:selectFolderForItem", {
              title: t0
            });
            $[11] = t;
            $[12] = t0;
            $[13] = t1;
          } else {
            t1 = $[13];
          }
          return t1;
        }
      }
  }
}
function ConfirmationMessage(props) {
  const $ = _c(14);
  const {
    t
  } = useTranslation();
  switch (props.action) {
    case "moveItemToFolder":
      {
        if (props.toFolderName) {
          let t0;
          if ($[0] !== props.title || $[1] !== props.toFolderName || $[2] !== t) {
            t0 = _jsx(Translation, {
              elements: {
                1: _temp,
                2: _temp2
              },
              i18nKey: "folder:moveItemToFolderConfirmation",
              t,
              variables: {
                title: props.title,
                toFolder: props.toFolderName
              }
            });
            $[0] = props.title;
            $[1] = props.toFolderName;
            $[2] = t;
            $[3] = t0;
          } else {
            t0 = $[3];
          }
          return t0;
        } else {
          let t0;
          if ($[4] !== props.title || $[5] !== t) {
            t0 = _jsx(Translation, {
              elements: {
                1: _temp3
              },
              i18nKey: "folder:moveItemToRootConfirmation",
              t,
              variables: {
                title: props.title
              }
            });
            $[4] = props.title;
            $[5] = t;
            $[6] = t0;
          } else {
            t0 = $[6];
          }
          return t0;
        }
      }
    case "moveItemsToFolder":
      {
        if (props.toFolderName) {
          let t0;
          if ($[7] !== props.count || $[8] !== props.toFolderName || $[9] !== t) {
            t0 = _jsx(Translation, {
              elements: {
                1: _temp4,
                2: _temp5
              },
              i18nKey: "folder:moveItemsToFolderConfirmation",
              t,
              variables: {
                count: props.count,
                label: props.count > 1 ? t("general:items") : t("general:item"),
                toFolder: props.toFolderName
              }
            });
            $[7] = props.count;
            $[8] = props.toFolderName;
            $[9] = t;
            $[10] = t0;
          } else {
            t0 = $[10];
          }
          return t0;
        } else {
          let t0;
          if ($[11] !== props.count || $[12] !== t) {
            t0 = _jsx(Translation, {
              elements: {
                1: _temp6
              },
              i18nKey: "folder:moveItemsToRootConfirmation",
              t,
              variables: {
                count: props.count,
                label: props.count > 1 ? t("general:items") : t("general:item")
              }
            });
            $[11] = props.count;
            $[12] = t;
            $[13] = t0;
          } else {
            t0 = $[13];
          }
          return t0;
        }
      }
  }
}
function _temp6(t0) {
  const {
    children: children_1
  } = t0;
  return _jsx("strong", {
    children: children_1
  });
}
function _temp5(t0) {
  const {
    children: children_0
  } = t0;
  return _jsx("strong", {
    children: children_0
  });
}
function _temp4(t0) {
  const {
    children
  } = t0;
  return _jsx("strong", {
    children
  });
}
function _temp3(t0) {
  const {
    children: children_4
  } = t0;
  return _jsx("strong", {
    children: children_4
  });
}
function _temp2(t0) {
  const {
    children: children_3
  } = t0;
  return _jsx("strong", {
    children: children_3
  });
}
function _temp(t0) {
  const {
    children: children_2
  } = t0;
  return _jsx("strong", {
    children: children_2
  });
}
//# sourceMappingURL=index.js.map