'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useConfig } from '../../../providers/Config/index.js';
import { useFolder } from '../../../providers/Folders/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Button } from '../../Button/index.js';
import { DocumentDrawer, useDocumentDrawer } from '../../DocumentDrawer/index.js';
import { Popup, PopupList } from '../../Popup/index.js';
const baseClass = 'create-new-doc-in-folder';
export function ListCreateNewDocInFolderButton(t0) {
  const $ = _c(22);
  const {
    buttonLabel,
    collectionSlugs,
    folderAssignedCollections,
    onCreateSuccess,
    slugPrefix
  } = t0;
  const newDocInFolderDrawerSlug = `${slugPrefix}-new-doc-in-folder-drawer`;
  const {
    i18n
  } = useTranslation();
  const {
    closeModal,
    openModal
  } = useModal();
  const {
    config
  } = useConfig();
  const {
    folderCollectionConfig,
    folderCollectionSlug,
    folderFieldName,
    folderID
  } = useFolder();
  let t1;
  if ($[0] !== folderCollectionSlug) {
    t1 = {
      collectionSlug: folderCollectionSlug
    };
    $[0] = folderCollectionSlug;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [FolderDocumentDrawer,, t2] = useDocumentDrawer(t1);
  const {
    closeDrawer: closeFolderDrawer,
    openDrawer: openFolderDrawer
  } = t2;
  const [createCollectionSlug, setCreateCollectionSlug] = React.useState();
  let t3;
  if ($[2] !== collectionSlugs || $[3] !== config) {
    t3 = () => collectionSlugs.reduce((acc, collectionSlug) => {
      const collectionConfig = config.collections.find(t4 => {
        const {
          slug
        } = t4;
        return slug === collectionSlug;
      });
      if (collectionConfig) {
        acc.push(collectionConfig);
      }
      return acc;
    }, []);
    $[2] = collectionSlugs;
    $[3] = config;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const [enabledCollections] = React.useState(t3);
  if (enabledCollections.length === 0) {
    return null;
  }
  let t4;
  if ($[5] !== FolderDocumentDrawer || $[6] !== buttonLabel || $[7] !== closeFolderDrawer || $[8] !== closeModal || $[9] !== collectionSlugs || $[10] !== createCollectionSlug || $[11] !== enabledCollections || $[12] !== folderAssignedCollections || $[13] !== folderCollectionConfig.slug || $[14] !== folderFieldName || $[15] !== folderID || $[16] !== i18n || $[17] !== newDocInFolderDrawerSlug || $[18] !== onCreateSuccess || $[19] !== openFolderDrawer || $[20] !== openModal) {
    t4 = _jsxs(React.Fragment, {
      children: [enabledCollections.length === 1 ? _jsx(Button, {
        buttonStyle: "pill",
        className: `${baseClass}__button`,
        el: "div",
        onClick: () => {
          if (enabledCollections[0].slug === folderCollectionConfig.slug) {
            openFolderDrawer();
          } else {
            setCreateCollectionSlug(enabledCollections[0].slug);
            openModal(newDocInFolderDrawerSlug);
          }
        },
        size: "small",
        children: buttonLabel
      }) : _jsx(Popup, {
        button: _jsx(Button, {
          buttonStyle: "pill",
          className: `${baseClass}__popup-button`,
          el: "div",
          icon: "chevron",
          size: "small",
          children: buttonLabel
        }),
        buttonType: "default",
        className: `${baseClass}__action-popup`,
        children: _jsx(PopupList.ButtonGroup, {
          children: enabledCollections.map((collection, index) => _jsx(PopupList.Button, {
            onClick: () => {
              if (collection.slug === folderCollectionConfig.slug) {
                openFolderDrawer();
              } else {
                setCreateCollectionSlug(collection.slug);
                openModal(newDocInFolderDrawerSlug);
              }
            },
            children: getTranslation(collection.labels.singular, i18n)
          }, index))
        })
      }), createCollectionSlug && _jsx(DocumentDrawer, {
        collectionSlug: createCollectionSlug,
        drawerSlug: newDocInFolderDrawerSlug,
        initialData: {
          [folderFieldName]: folderID
        },
        onSave: async t5 => {
          const {
            doc
          } = t5;
          await onCreateSuccess({
            collectionSlug: createCollectionSlug,
            doc
          });
          closeModal(newDocInFolderDrawerSlug);
        },
        redirectAfterCreate: false
      }), collectionSlugs.includes(folderCollectionConfig.slug) && _jsx(FolderDocumentDrawer, {
        initialData: {
          [folderFieldName]: folderID,
          folderType: createCollectionSlug ? folderAssignedCollections || [createCollectionSlug] : folderAssignedCollections
        },
        onSave: async result => {
          await onCreateSuccess({
            collectionSlug: folderCollectionConfig.slug,
            doc: result.doc
          });
          closeFolderDrawer();
        },
        redirectAfterCreate: false
      })]
    });
    $[5] = FolderDocumentDrawer;
    $[6] = buttonLabel;
    $[7] = closeFolderDrawer;
    $[8] = closeModal;
    $[9] = collectionSlugs;
    $[10] = createCollectionSlug;
    $[11] = enabledCollections;
    $[12] = folderAssignedCollections;
    $[13] = folderCollectionConfig.slug;
    $[14] = folderFieldName;
    $[15] = folderID;
    $[16] = i18n;
    $[17] = newDocInFolderDrawerSlug;
    $[18] = onCreateSuccess;
    $[19] = openFolderDrawer;
    $[20] = openModal;
    $[21] = t4;
  } else {
    t4 = $[21];
  }
  return t4;
}
//# sourceMappingURL=ListCreateNewDocInFolderButton.js.map