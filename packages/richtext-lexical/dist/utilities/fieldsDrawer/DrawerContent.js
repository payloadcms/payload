'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { Form, FormSubmit, RenderFields, useDocumentForm, useDocumentInfo, useServerFunctions, useTranslation } from '@payloadcms/ui';
import { abortAndIgnore } from '@payloadcms/ui/shared';
import { deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useEditorConfigContext } from '../../lexical/config/client/EditorConfigProvider.js';
export const DrawerContent = ({
  data,
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  schemaFieldsPathOverride,
  schemaPath,
  schemaPathSuffix
}) => {
  const {
    t
  } = useTranslation();
  const {
    id,
    collectionSlug,
    getDocPreferences,
    globalSlug
  } = useDocumentInfo();
  const {
    fields: parentDocumentFields
  } = useDocumentForm();
  const isEditable = useLexicalEditable();
  const onChangeAbortControllerRef = useRef(new AbortController());
  const [initialState, setInitialState] = useState(false);
  const {
    fieldProps: {
      featureClientSchemaMap
    }
  } = useEditorConfigContext();
  const {
    getFormState
  } = useServerFunctions();
  const schemaFieldsPath = schemaFieldsPathOverride ?? `${schemaPath}.lexical_internal_feature.${featureKey}${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`;
  const fields = fieldMapOverride ?? featureClientSchemaMap[featureKey]?.[schemaFieldsPath] // Field Schema
  ;
  useEffect(() => {
    const controller = new AbortController();
    const awaitInitialState = async () => {
      const {
        state
      } = await getFormState({
        id,
        collectionSlug,
        data: data ?? {},
        docPermissions: {
          fields: true
        },
        docPreferences: await getDocPreferences(),
        documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields, {
          excludeFiles: true
        }),
        globalSlug,
        initialBlockData: data,
        operation: 'update',
        readOnly: !isEditable,
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: controller.signal
      });
      setInitialState(state);
    };
    void awaitInitialState();
    return () => {
      abortAndIgnore(controller);
    };
  }, [schemaFieldsPath, id, data, getFormState, collectionSlug, isEditable, globalSlug, getDocPreferences, parentDocumentFields]);
  const onChange = useCallback(async ({
    formState: prevFormState
  }) => {
    abortAndIgnore(onChangeAbortControllerRef.current);
    const controller_0 = new AbortController();
    onChangeAbortControllerRef.current = controller_0;
    const {
      state: state_0
    } = await getFormState({
      id,
      collectionSlug,
      docPermissions: {
        fields: true
      },
      docPreferences: await getDocPreferences(),
      documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields, {
        excludeFiles: true
      }),
      formState: prevFormState,
      globalSlug,
      initialBlockFormState: prevFormState,
      operation: 'update',
      readOnly: !isEditable,
      schemaPath: schemaFieldsPath,
      signal: controller_0.signal
    });
    if (!state_0) {
      return prevFormState;
    }
    return state_0;
  }, [getFormState, id, isEditable, collectionSlug, getDocPreferences, parentDocumentFields, globalSlug, schemaFieldsPath]);
  // cleanup effect
  useEffect(() => {
    return () => {
      abortAndIgnore(onChangeAbortControllerRef.current);
    };
  }, []);
  if (initialState === false) {
    return null;
  }
  return /*#__PURE__*/_jsxs(Form, {
    beforeSubmit: [onChange],
    disableValidationOnSubmit: true,
    fields: Array.isArray(fields) ? fields : [],
    initialState: initialState,
    onChange: [onChange],
    onSubmit: handleDrawerSubmit,
    uuid: uuid(),
    children: [/*#__PURE__*/_jsx(RenderFields, {
      fields: Array.isArray(fields) ? fields : [],
      forceRender: true,
      parentIndexPath: "",
      parentPath: "",
      parentSchemaPath: schemaFieldsPath,
      permissions: true,
      readOnly: !isEditable
    }), /*#__PURE__*/_jsx(FormSubmit, {
      children: t('fields:saveChanges')
    })]
  });
};
//# sourceMappingURL=DrawerContent.js.map