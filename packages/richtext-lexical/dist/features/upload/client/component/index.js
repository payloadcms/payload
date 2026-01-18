'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { getTranslation } from '@payloadcms/translations';
import { Button, formatDrawerSlug, Thumbnail, useConfig, useEditDepth, usePayloadAPI, useTranslation } from '@payloadcms/ui';
import { $getNodeByKey } from 'lexical';
import { formatAdminURL, isImage } from 'payload/shared';
import React, { useCallback, useId, useReducer, useRef, useState } from 'react';
import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js';
import { FieldsDrawer } from '../../../../utilities/fieldsDrawer/Drawer.js';
import { useLexicalDocumentDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDocumentDrawer.js';
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js';
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from '../drawer/commands.js';
const initialParams = {
  depth: 0
};
export const UploadComponent = props => {
  const {
    className: baseClass,
    data: {
      fields,
      relationTo,
      value
    },
    format,
    nodeKey
  } = props;
  if (typeof value === 'object') {
    throw new Error('Upload value should be a string or number. The Lexical Upload component should not receive the populated value object.');
  }
  const {
    config: {
      routes: {
        api
      },
      serverURL
    },
    getEntityConfig
  } = useConfig();
  const uploadRef = useRef(null);
  const {
    uuid
  } = useEditorConfigContext();
  const editDepth = useEditDepth();
  const [editor] = useLexicalComposerContext();
  const {
    editorConfig,
    fieldProps: {
      schemaPath
    }
  } = useEditorConfigContext();
  const isEditable = useLexicalEditable();
  const {
    i18n,
    t
  } = useTranslation();
  const [cacheBust, dispatchCacheBust] = useReducer(state => state + 1, 0);
  const [relatedCollection] = useState(() => getEntityConfig({
    collectionSlug: relationTo
  }));
  const componentID = useId();
  const extraFieldsDrawerSlug = formatDrawerSlug({
    slug: `lexical-upload-drawer-` + uuid + componentID,
    depth: editDepth
  });
  // Need to use hook to initialize useEffect that restores cursor position
  const {
    toggleDrawer
  } = useLexicalDrawer(extraFieldsDrawerSlug, true);
  const {
    closeDocumentDrawer,
    DocumentDrawer,
    DocumentDrawerToggler
  } = useLexicalDocumentDrawer({
    id: value,
    collectionSlug: relatedCollection.slug
  });
  // Get the referenced document
  const [{
    data
  }, {
    setParams
  }] = usePayloadAPI(formatAdminURL({
    apiRoute: api,
    path: `/${relatedCollection.slug}/${value}`,
    serverURL
  }), {
    initialParams
  });
  const thumbnailSRC = data?.thumbnailURL || data?.url;
  const removeUpload = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove();
    });
  }, [editor, nodeKey]);
  const updateUpload = useCallback(_data => {
    setParams({
      ...initialParams,
      cacheBust
    });
    dispatchCacheBust();
    closeDocumentDrawer();
  }, [setParams, cacheBust, closeDocumentDrawer]);
  const hasExtraFields = editorConfig?.resolvedFeatureMap?.get('upload')?.sanitizedClientFeatureProps.collections?.[relatedCollection.slug]?.hasExtraFields;
  const onExtraFieldsDrawerSubmit = useCallback((_, data_0) => {
    // Update lexical node (with key nodeKey) with new data
    editor.update(() => {
      const uploadNode = $getNodeByKey(nodeKey);
      if (uploadNode) {
        const newData = {
          ...uploadNode.getData(),
          fields: data_0
        };
        uploadNode.setData(newData);
      }
    });
  }, [editor, nodeKey]);
  const aspectRatio = thumbnailSRC && data?.width && data?.height ? data.width > data.height ? 'landscape' : 'portrait' : 'landscape';
  return /*#__PURE__*/_jsxs("div", {
    className: `${baseClass}__contents ${baseClass}__contents--${aspectRatio}`,
    "data-align": format || undefined,
    "data-filename": data?.filename,
    ref: uploadRef,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__card`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__media`,
        children: [/*#__PURE__*/_jsx(Thumbnail, {
          collectionSlug: relationTo,
          fileSrc: isImage(data?.mimeType) ? thumbnailSRC : null,
          height: data?.height,
          size: "none",
          width: data?.width
        }), isEditable && /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__overlay ${baseClass}__floater`,
          children: /*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__actions`,
            role: "toolbar",
            children: [hasExtraFields ? /*#__PURE__*/_jsx(Button, {
              buttonStyle: "icon-label",
              className: `${baseClass}__upload-drawer-toggler`,
              disabled: !isEditable,
              el: "button",
              icon: "edit",
              onClick: toggleDrawer,
              round: true,
              size: "medium",
              tooltip: t('fields:editRelationship')
            }) : null, /*#__PURE__*/_jsx(Button, {
              buttonStyle: "icon-label",
              className: `${baseClass}__swap-drawer-toggler`,
              disabled: !isEditable,
              el: "button",
              icon: "swap",
              onClick: () => {
                editor.dispatchCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, {
                  replace: {
                    nodeKey
                  }
                });
              },
              round: true,
              size: "medium",
              tooltip: t('fields:swapUpload')
            }), /*#__PURE__*/_jsx(Button, {
              buttonStyle: "icon-label",
              className: `${baseClass}__removeButton`,
              disabled: !isEditable,
              icon: "x",
              onClick: e => {
                e.preventDefault();
                removeUpload();
              },
              round: true,
              size: "medium",
              tooltip: t('fields:removeUpload')
            })]
          })
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__metaOverlay ${baseClass}__floater`,
        children: [/*#__PURE__*/_jsx(DocumentDrawerToggler, {
          className: `${baseClass}__doc-drawer-toggler`,
          children: /*#__PURE__*/_jsx("strong", {
            className: `${baseClass}__filename`,
            children: data?.filename || t('general:untitled')
          })
        }), /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__collectionLabel`,
          children: getTranslation(relatedCollection.labels.singular, i18n)
        })]
      })]
    }), value ? /*#__PURE__*/_jsx(DocumentDrawer, {
      onSave: updateUpload
    }) : null, hasExtraFields ? /*#__PURE__*/_jsx(FieldsDrawer, {
      data: fields,
      drawerSlug: extraFieldsDrawerSlug,
      drawerTitle: t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n)
      }),
      featureKey: "upload",
      handleDrawerSubmit: onExtraFieldsDrawerSubmit,
      schemaPath: schemaPath,
      schemaPathSuffix: relatedCollection.slug
    }) : null]
  });
};
//# sourceMappingURL=index.js.map