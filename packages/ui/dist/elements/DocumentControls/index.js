'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { formatAdminURL, hasAutosaveEnabled, hasDraftsEnabled } from 'payload/shared';
import React, { Fragment, useEffect } from 'react';
import { useFormInitializing, useFormProcessing } from '../../forms/Form/context.js';
import { useConfig } from '../../providers/Config/index.js';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { useLivePreviewContext } from '../../providers/LivePreview/context.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { formatDate } from '../../utilities/formatDocTitle/formatDateTitle.js';
import { Autosave } from '../Autosave/index.js';
import { Button } from '../Button/index.js';
import { CopyLocaleData } from '../CopyLocaleData/index.js';
import { DeleteDocument } from '../DeleteDocument/index.js';
import { DuplicateDocument } from '../DuplicateDocument/index.js';
import { MoveDocToFolder } from '../FolderView/MoveDocToFolder/index.js';
import { Gutter } from '../Gutter/index.js';
import { LivePreviewToggler } from '../LivePreview/Toggler/index.js';
import { Locked } from '../Locked/index.js';
import { PermanentlyDeleteButton } from '../PermanentlyDeleteButton/index.js';
import { Popup, PopupList } from '../Popup/index.js';
import { PreviewButton } from '../PreviewButton/index.js';
import { PublishButton } from '../PublishButton/index.js';
import { RenderCustomComponent } from '../RenderCustomComponent/index.js';
import { RestoreButton } from '../RestoreButton/index.js';
import { SaveButton } from '../SaveButton/index.js';
import './index.scss';
import { SaveDraftButton } from '../SaveDraftButton/index.js';
import { Status } from '../Status/index.js';
const baseClass = 'doc-controls';
export const DocumentControls = props => {
  const $ = _c(5);
  const {
    id,
    slug,
    BeforeDocumentControls,
    customComponents: t0,
    data,
    disableActions,
    disableCreate,
    EditMenuItems,
    hasSavePermission,
    isAccountView,
    isEditing,
    isInDrawer,
    isTrashed,
    onDelete,
    onDrawerCreateNew,
    onDuplicate,
    onRestore,
    onTakeOver,
    permissions,
    readOnlyForIncomingUser,
    redirectAfterDelete,
    redirectAfterDuplicate,
    redirectAfterRestore,
    user
  } = props;
  const {
    PreviewButton: CustomPreviewButton,
    PublishButton: CustomPublishButton,
    SaveButton: CustomSaveButton,
    SaveDraftButton: CustomSaveDraftButton,
    Status: CustomStatus
  } = t0 === undefined ? {} : t0;
  const {
    i18n,
    t
  } = useTranslation();
  const editDepth = useEditDepth();
  const {
    config,
    getEntityConfig
  } = useConfig();
  const collectionConfig = getEntityConfig({
    collectionSlug: slug
  });
  const globalConfig = getEntityConfig({
    globalSlug: slug
  });
  const {
    isLivePreviewEnabled
  } = useLivePreviewContext();
  const {
    admin: t1,
    localization,
    routes: t2
  } = config;
  const {
    dateFormat
  } = t1;
  const {
    admin: adminRoute
  } = t2;
  const [updatedAt, setUpdatedAt] = React.useState("");
  const [createdAt, setCreatedAt] = React.useState("");
  const processing = useFormProcessing();
  const initializing = useFormInitializing();
  let t3;
  let t4;
  if ($[0] !== data || $[1] !== dateFormat || $[2] !== i18n) {
    t3 = () => {
      if (data?.updatedAt) {
        setUpdatedAt(formatDate({
          date: data.updatedAt,
          i18n,
          pattern: dateFormat
        }));
      }
      if (data?.createdAt) {
        setCreatedAt(formatDate({
          date: data.createdAt,
          i18n,
          pattern: dateFormat
        }));
      }
    };
    t4 = [data, i18n, dateFormat];
    $[0] = data;
    $[1] = dateFormat;
    $[2] = i18n;
    $[3] = t3;
    $[4] = t4;
  } else {
    t3 = $[3];
    t4 = $[4];
  }
  useEffect(t3, t4);
  const hasCreatePermission = permissions && "create" in permissions && permissions.create;
  const hasDeletePermission = permissions && "delete" in permissions && permissions.delete;
  const showDotMenu = Boolean(collectionConfig && id && !disableActions && (hasCreatePermission || hasDeletePermission));
  const unsavedDraftWithValidations = !id && collectionConfig?.versions?.drafts && collectionConfig.versions?.drafts.validate;
  const globalHasDraftsEnabled = hasDraftsEnabled(globalConfig);
  const collectionHasDraftsEnabled = hasDraftsEnabled(collectionConfig);
  const collectionAutosaveEnabled = hasAutosaveEnabled(collectionConfig);
  const globalAutosaveEnabled = hasAutosaveEnabled(globalConfig);
  const autosaveEnabled = collectionAutosaveEnabled || globalAutosaveEnabled;
  const showSaveDraftButton = collectionAutosaveEnabled && collectionConfig.versions.drafts.autosave !== false && collectionConfig.versions.drafts.autosave.showSaveDraftButton === true || globalAutosaveEnabled && globalConfig.versions.drafts.autosave !== false && globalConfig.versions.drafts.autosave.showSaveDraftButton === true;
  const showCopyToLocale = localization && !collectionConfig?.admin?.disableCopyToLocale;
  const showFolderMetaIcon = collectionConfig && collectionConfig.folders;
  const showLockedMetaIcon = user && readOnlyForIncomingUser;
  return _jsxs(Gutter, {
    className: baseClass,
    children: [_jsxs("div", {
      className: `${baseClass}__wrapper`,
      children: [_jsxs("div", {
        className: `${baseClass}__content`,
        children: [showLockedMetaIcon || showFolderMetaIcon ? _jsxs("div", {
          className: `${baseClass}__meta-icons`,
          children: [showLockedMetaIcon && _jsx(Locked, {
            className: `${baseClass}__locked-controls`,
            user
          }), showFolderMetaIcon && config.folders && !isTrashed && _jsx(MoveDocToFolder, {
            folderCollectionSlug: config.folders.slug,
            folderFieldName: config.folders.fieldName
          })]
        }) : null, _jsxs("ul", {
          className: `${baseClass}__meta`,
          children: [collectionConfig && !isEditing && !isAccountView && _jsx("li", {
            className: `${baseClass}__list-item`,
            children: _jsx("p", {
              className: `${baseClass}__value`,
              children: i18n.t("general:creatingNewLabel", {
                label: getTranslation(collectionConfig?.labels?.singular ?? i18n.t("general:document"), i18n)
              })
            })
          }), (collectionHasDraftsEnabled || globalHasDraftsEnabled) && _jsxs(Fragment, {
            children: [(globalConfig || collectionConfig && isEditing) && _jsx("li", {
              className: [`${baseClass}__status`, `${baseClass}__list-item`].filter(Boolean).join(" "),
              children: _jsx(RenderCustomComponent, {
                CustomComponent: CustomStatus,
                Fallback: _jsx(Status, {})
              })
            }), hasSavePermission && autosaveEnabled && !unsavedDraftWithValidations && !isTrashed && _jsx("li", {
              className: `${baseClass}__list-item`,
              children: _jsx(Autosave, {
                collection: collectionConfig,
                global: globalConfig,
                id,
                publishedDocUpdatedAt: data?.createdAt
              })
            })]
          }), collectionConfig?.timestamps && (isEditing || isAccountView) && _jsxs(Fragment, {
            children: [_jsxs("li", {
              className: [`${baseClass}__list-item`, `${baseClass}__value-wrap`].filter(Boolean).join(" "),
              title: data?.updatedAt ? updatedAt : "",
              children: [_jsxs("p", {
                className: `${baseClass}__label`,
                children: [i18n.t(isTrashed ? "general:deleted" : "general:lastModified"), ":\xA0"]
              }), data?.updatedAt && _jsx("p", {
                className: `${baseClass}__value`,
                children: updatedAt
              })]
            }), _jsxs("li", {
              className: [`${baseClass}__list-item`, `${baseClass}__value-wrap`].filter(Boolean).join(" "),
              title: data?.createdAt ? createdAt : "",
              children: [_jsxs("p", {
                className: `${baseClass}__label`,
                children: [i18n.t("general:created"), ":\xA0"]
              }), data?.createdAt && _jsx("p", {
                className: `${baseClass}__value`,
                children: createdAt
              })]
            })]
          })]
        })]
      }), _jsxs("div", {
        className: `${baseClass}__controls-wrapper`,
        children: [_jsxs("div", {
          className: `${baseClass}__controls`,
          children: [BeforeDocumentControls, isLivePreviewEnabled && !isInDrawer && _jsx(LivePreviewToggler, {}), (collectionConfig?.admin.preview || globalConfig?.admin.preview) && _jsx(RenderCustomComponent, {
            CustomComponent: CustomPreviewButton,
            Fallback: _jsx(PreviewButton, {})
          }), hasSavePermission && !isTrashed && _jsx(Fragment, {
            children: collectionHasDraftsEnabled || globalHasDraftsEnabled ? _jsxs(Fragment, {
              children: [(unsavedDraftWithValidations || !autosaveEnabled || autosaveEnabled && showSaveDraftButton) && _jsx(RenderCustomComponent, {
                CustomComponent: CustomSaveDraftButton,
                Fallback: _jsx(SaveDraftButton, {})
              }), _jsx(RenderCustomComponent, {
                CustomComponent: CustomPublishButton,
                Fallback: _jsx(PublishButton, {})
              })]
            }) : _jsx(RenderCustomComponent, {
              CustomComponent: CustomSaveButton,
              Fallback: _jsx(SaveButton, {})
            })
          }), hasDeletePermission && isTrashed && _jsx(PermanentlyDeleteButton, {
            buttonId: "action-permanently-delete",
            collectionSlug: collectionConfig?.slug,
            id: id.toString(),
            onDelete,
            redirectAfterDelete,
            singularLabel: collectionConfig?.labels?.singular
          }), hasSavePermission && isTrashed && _jsx(RestoreButton, {
            buttonId: "action-restore",
            collectionSlug: collectionConfig?.slug,
            id: id.toString(),
            onRestore,
            redirectAfterRestore,
            singularLabel: collectionConfig?.labels?.singular
          }), user && readOnlyForIncomingUser && _jsx(Button, {
            buttonStyle: "secondary",
            id: "take-over",
            onClick: onTakeOver,
            size: "medium",
            type: "button",
            children: t("general:takeOver")
          })]
        }), showDotMenu && !readOnlyForIncomingUser && _jsx(Popup, {
          button: _jsxs("div", {
            className: `${baseClass}__dots`,
            children: [_jsx("div", {}), _jsx("div", {}), _jsx("div", {})]
          }),
          className: `${baseClass}__popup`,
          disabled: initializing || processing,
          horizontalAlign: "right",
          size: "large",
          verticalAlign: "bottom",
          children: _jsxs(PopupList.ButtonGroup, {
            children: [showCopyToLocale && _jsx(CopyLocaleData, {}), hasCreatePermission && _jsxs(React.Fragment, {
              children: [!disableCreate && _jsx(Fragment, {
                children: editDepth > 1 ? _jsx(PopupList.Button, {
                  id: "action-create",
                  onClick: onDrawerCreateNew,
                  children: i18n.t("general:createNew")
                }) : _jsx(PopupList.Button, {
                  href: formatAdminURL({
                    adminRoute,
                    path: `/collections/${collectionConfig?.slug}/create`
                  }),
                  id: "action-create",
                  children: i18n.t("general:createNew")
                })
              }), collectionConfig.disableDuplicate !== true && isEditing && _jsxs(_Fragment, {
                children: [_jsx(DuplicateDocument, {
                  id,
                  onDuplicate,
                  redirectAfterDuplicate,
                  singularLabel: collectionConfig?.labels?.singular,
                  slug: collectionConfig?.slug
                }), localization && _jsx(DuplicateDocument, {
                  id,
                  onDuplicate,
                  redirectAfterDuplicate,
                  selectLocales: true,
                  singularLabel: collectionConfig?.labels?.singular,
                  slug: collectionConfig?.slug
                })]
              })]
            }), hasDeletePermission && _jsx(DeleteDocument, {
              buttonId: "action-delete",
              collectionSlug: collectionConfig?.slug,
              id: id.toString(),
              onDelete,
              redirectAfterDelete,
              singularLabel: collectionConfig?.labels?.singular,
              useAsTitle: collectionConfig?.admin?.useAsTitle
            }), EditMenuItems]
          })
        })]
      })]
    }), _jsx("div", {
      className: `${baseClass}__divider`
    })]
  });
};
//# sourceMappingURL=index.js.map