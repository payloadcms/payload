'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { getTranslation } from '@payloadcms/translations';
import { Button, useConfig, usePayloadAPI, useTranslation } from '@payloadcms/ui';
import { $getNodeByKey } from 'lexical';
import { formatAdminURL } from 'payload/shared';
import React, { useCallback, useReducer, useRef, useState } from 'react';
import { useLexicalDocumentDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDocumentDrawer.js';
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from '../drawer/commands.js';
const initialParams = {
  depth: 0
};
export const RelationshipComponent = props => {
  const {
    className: baseClass,
    data: {
      relationTo,
      value
    },
    nodeKey
  } = props;
  if (typeof value === 'object') {
    throw new Error('Relationship value should be a string or number. The Lexical Relationship component should not receive the populated value object.');
  }
  const relationshipElemRef = useRef(null);
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const {
    config: {
      routes: {
        api
      },
      serverURL
    },
    getEntityConfig
  } = useConfig();
  const [relatedCollection] = useState(() => getEntityConfig({
    collectionSlug: relationTo
  }));
  const {
    i18n,
    t
  } = useTranslation();
  const [cacheBust, dispatchCacheBust] = useReducer(state => state + 1, 0);
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
  const {
    closeDocumentDrawer,
    DocumentDrawer,
    DocumentDrawerToggler
  } = useLexicalDocumentDrawer({
    id: value,
    collectionSlug: relatedCollection.slug
  });
  const removeRelationship = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove();
    });
  }, [editor, nodeKey]);
  const updateRelationship = React.useCallback(() => {
    setParams({
      ...initialParams,
      cacheBust
    });
    closeDocumentDrawer();
    dispatchCacheBust();
  }, [cacheBust, setParams, closeDocumentDrawer]);
  return /*#__PURE__*/_jsxs("div", {
    className: `${baseClass}__contents`,
    contentEditable: false,
    ref: relationshipElemRef,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__wrap`,
      children: [/*#__PURE__*/_jsx("p", {
        className: `${baseClass}__label`,
        children: t('fields:labelRelationship', {
          label: relatedCollection.labels?.singular ? getTranslation(relatedCollection.labels?.singular, i18n) : relatedCollection.slug
        })
      }), /*#__PURE__*/_jsx(DocumentDrawerToggler, {
        className: `${baseClass}__doc-drawer-toggler`,
        children: /*#__PURE__*/_jsx("p", {
          className: `${baseClass}__title`,
          children: data ? data[relatedCollection?.admin?.useAsTitle || 'id'] : value
        })
      })]
    }), isEditable && /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__actions`,
      children: [/*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__swapButton`,
        disabled: !isEditable,
        el: "button",
        icon: "swap",
        onClick: () => {
          if (nodeKey) {
            editor.dispatchCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, {
              replace: {
                nodeKey
              }
            });
          }
        },
        round: true,
        tooltip: t('fields:swapRelationship')
      }), /*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__removeButton`,
        disabled: !isEditable,
        icon: "x",
        onClick: e => {
          e.preventDefault();
          removeRelationship();
        },
        round: true,
        tooltip: t('fields:removeRelationship')
      })]
    }), !!value && /*#__PURE__*/_jsx(DocumentDrawer, {
      onSave: updateRelationship
    })]
  });
};
//# sourceMappingURL=RelationshipComponent.js.map