'use client';

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { getTranslation } from '@payloadcms/translations';
import { Button, Drawer, EditDepthProvider, Form, formatDrawerSlug, FormSubmit, RenderFields, ShimmerEffect, useConfig, useDocumentForm, useDocumentInfo, useEditDepth, useServerFunctions, useTranslation } from '@payloadcms/ui';
import { abortAndIgnore } from '@payloadcms/ui/shared';
import { $getNodeByKey } from 'lexical';
import { deepCopyObjectSimpleWithoutReactComponents, reduceFieldsToValues } from 'payload/shared';
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js';
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js';
import { $isInlineBlockNode } from '../nodes/InlineBlocksNode.js';
const InlineBlockComponentContext = /*#__PURE__*/createContext({
  initialState: false
});
export const useInlineBlockComponentContext = () => React.use(InlineBlockComponentContext);
export const InlineBlockComponent = props => {
  const {
    cacheBuster,
    className: baseClass,
    formData,
    nodeKey
  } = props;
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    createdInlineBlock,
    fieldProps: {
      featureClientSchemaMap,
      initialLexicalFormState,
      schemaPath
    },
    setCreatedInlineBlock,
    uuid: uuidFromContext
  } = useEditorConfigContext();
  const {
    fields: parentDocumentFields
  } = useDocumentForm();
  const {
    getFormState
  } = useServerFunctions();
  const editDepth = useEditDepth();
  const firstTimeDrawer = useRef(false);
  const [initialState, setInitialState] = React.useState(() => {
    // Initial form state that was calculated server-side. May have stale values
    const cachedFormState = initialLexicalFormState?.[formData.id]?.formState;
    if (!cachedFormState) {
      return false;
    }
    // Merge current formData values into the cached form state
    // This ensures that when the component remounts (e.g., due to view changes), we don't lose user edits
    return Object.fromEntries(Object.entries(cachedFormState).map(([fieldName, fieldState]) => [fieldName, fieldName in formData ? {
      ...fieldState,
      initialValue: formData[fieldName],
      value: formData[fieldName]
    } : fieldState]));
  });
  const hasMounted = useRef(false);
  const prevCacheBuster = useRef(cacheBuster);
  useEffect(() => {
    if (hasMounted.current) {
      if (prevCacheBuster.current !== cacheBuster) {
        setInitialState(false);
      }
      prevCacheBuster.current = cacheBuster;
    } else {
      hasMounted.current = true;
    }
  }, [cacheBuster]);
  const [CustomLabel, setCustomLabel] = React.useState(
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  initialState?.['_components']?.customComponents?.BlockLabel);
  const [CustomBlock, setCustomBlock] = React.useState(
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  initialState?.['_components']?.customComponents?.Block);
  const drawerSlug = formatDrawerSlug({
    slug: `lexical-inlineBlocks-create-${uuidFromContext}-${formData.id}`,
    depth: editDepth
  });
  const {
    toggleDrawer
  } = useLexicalDrawer(drawerSlug, true);
  const inlineBlockElemElemRef = useRef(null);
  const {
    id,
    collectionSlug,
    getDocPreferences,
    globalSlug
  } = useDocumentInfo();
  const {
    config
  } = useConfig();
  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${formData.blockType}`;
  const clientSchemaMap = featureClientSchemaMap['blocks'];
  const blocksField = clientSchemaMap?.[componentMapRenderedBlockPath]?.[0];
  const clientBlock = blocksField.blockReferences ? typeof blocksField?.blockReferences?.[0] === 'string' ? config.blocksMap[blocksField?.blockReferences?.[0]] : blocksField?.blockReferences?.[0] : blocksField?.blocks?.[0];
  const clientBlockFields = clientBlock?.fields ?? [];
  // Open drawer on "mount"
  useEffect(() => {
    if (!firstTimeDrawer.current && createdInlineBlock?.getKey() === nodeKey) {
      // > 2 because they always have "id" and "blockName" fields
      if (clientBlockFields.length > 2) {
        toggleDrawer();
      }
      setCreatedInlineBlock?.(undefined);
      firstTimeDrawer.current = true;
    }
  }, [clientBlockFields.length, createdInlineBlock, nodeKey, setCreatedInlineBlock, toggleDrawer]);
  const removeInlineBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove();
    });
  }, [editor, nodeKey]);
  const blockDisplayName = clientBlock?.labels?.singular ? getTranslation(clientBlock?.labels.singular, i18n) : clientBlock?.slug;
  const onChangeAbortControllerRef = useRef(new AbortController());
  const schemaFieldsPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${clientBlock?.slug}.fields`;
  // Initial state for newly created blocks
  useEffect(() => {
    const abortController = new AbortController();
    const awaitInitialState = async () => {
      /*
      * This will only run if a new block is created. For all existing blocks that are loaded when the document is loaded, or when the form is saved,
      * this is not run, as the lexical field RSC will fetch the state server-side and pass it to the client. That way, we avoid unnecessary client-side
      * requests. Though for newly created blocks, we need to fetch the state client-side, as the server doesn't know about the block yet.
      */
      const {
        state
      } = await getFormState({
        id,
        collectionSlug,
        data: formData,
        docPermissions: {
          fields: true
        },
        docPreferences: await getDocPreferences(),
        documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields, {
          excludeFiles: true
        }),
        globalSlug,
        initialBlockData: formData,
        initialBlockFormState: formData,
        operation: 'update',
        readOnly: !isEditable,
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: abortController.signal
      });
      if (state) {
        const newFormStateData = reduceFieldsToValues(deepCopyObjectSimpleWithoutReactComponents(state, {
          excludeFiles: true
        }), true);
        // Things like default values may come back from the server => update the node with the new data
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (node && $isInlineBlockNode(node)) {
            const newData = newFormStateData;
            newData.blockType = formData.blockType;
            node.setFields(newData, true);
          }
        });
        setInitialState(state);
        setCustomLabel(state['_components']?.customComponents?.BlockLabel);
        setCustomBlock(state['_components']?.customComponents?.Block);
      }
    };
    if (formData && !initialState) {
      void awaitInitialState();
    }
    return () => {
      abortAndIgnore(abortController);
    };
  }, [getFormState, editor, nodeKey, isEditable, schemaFieldsPath, id, formData, initialState, collectionSlug, globalSlug, getDocPreferences, parentDocumentFields]);
  /**
  * HANDLE ONCHANGE
  */
  const onChange = useCallback(async ({
    formState: prevFormState,
    submit
  }) => {
    abortAndIgnore(onChangeAbortControllerRef.current);
    const controller = new AbortController();
    onChangeAbortControllerRef.current = controller;
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
      renderAllFields: submit ? true : false,
      schemaPath: schemaFieldsPath,
      signal: controller.signal
    });
    if (!state_0) {
      return prevFormState;
    }
    if (submit) {
      setCustomLabel(state_0['_components']?.customComponents?.BlockLabel);
      setCustomBlock(state_0['_components']?.customComponents?.Block);
    }
    return state_0;
  }, [getFormState, id, collectionSlug, getDocPreferences, parentDocumentFields, globalSlug, isEditable, schemaFieldsPath]);
  // cleanup effect
  useEffect(() => {
    const isStateOutOfSync = (formData_0, initialState_0) => {
      return Object.keys(initialState_0).some(key => initialState_0[key] && formData_0[key] !== initialState_0[key].value);
    };
    return () => {
      // If the component is unmounted (either via removeInlineBlock or via lexical itself) and the form state got changed before,
      // we need to reset the initial state to force a re-fetch of the initial state when it gets mounted again (e.g. via lexical history undo).
      // Otherwise it would use an outdated initial state.
      if (initialState && isStateOutOfSync(formData, initialState)) {
        setInitialState(false);
      }
      abortAndIgnore(onChangeAbortControllerRef.current);
    };
  }, [formData, initialState]);
  /**
  * HANDLE FORM SUBMIT
  */
  const onFormSubmit = useCallback((formState, newData_0) => {
    newData_0.blockType = formData.blockType;
    editor.update(() => {
      const node_0 = $getNodeByKey(nodeKey);
      if (node_0 && $isInlineBlockNode(node_0)) {
        node_0.setFields(newData_0, true);
      }
    });
  }, [editor, nodeKey, formData]);
  const RemoveButton = useMemo(() => () => /*#__PURE__*/_jsx(Button, {
    buttonStyle: "icon-label",
    className: `${baseClass}__removeButton`,
    disabled: !isEditable,
    icon: "x",
    onClick: e => {
      e.preventDefault();
      removeInlineBlock();
    },
    round: true,
    size: "small",
    tooltip: t('lexical:blocks:inlineBlocks:remove', {
      label: blockDisplayName
    })
  }), [baseClass, blockDisplayName, isEditable, removeInlineBlock, t]);
  const EditButton = useMemo(() => () => /*#__PURE__*/_jsx(Button, {
    buttonStyle: "icon-label",
    className: `${baseClass}__editButton`,
    disabled: !isEditable,
    el: "button",
    icon: "edit",
    onClick: () => {
      toggleDrawer();
    },
    round: true,
    size: "small",
    tooltip: t('lexical:blocks:inlineBlocks:edit', {
      label: blockDisplayName
    })
  }), [baseClass, blockDisplayName, isEditable, t, toggleDrawer]);
  const InlineBlockContainer = useMemo(() => ({
    children,
    className
  }) => /*#__PURE__*/_jsx("div", {
    className: [`${baseClass}__container`, baseClass + '-' + formData.blockType, className].filter(Boolean).join(' '),
    ref: inlineBlockElemElemRef,
    children: children
  }), [baseClass, formData.blockType]);
  const Label = useMemo(() => {
    if (CustomLabel) {
      return () => CustomLabel;
    } else {
      return () => /*#__PURE__*/_jsx("div", {
        children: clientBlock?.labels ? getTranslation(clientBlock?.labels.singular, i18n) : ''
      });
    }
  }, [CustomLabel, clientBlock?.labels, i18n]);
  if (!clientBlock) {
    return /*#__PURE__*/_jsxs(InlineBlockContainer, {
      className: `${baseClass}-not-found`,
      children: [/*#__PURE__*/_jsxs("span", {
        children: ["Error: Block '", formData.blockType, "' not found"]
      }), isEditable ? /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__actions`,
        children: /*#__PURE__*/_jsx(RemoveButton, {})
      }) : null]
    });
  }
  return /*#__PURE__*/_jsxs(Form, {
    beforeSubmit: [async ({
      formState: formState_0
    }) => {
      // This is only called when form is submitted from drawer
      return await onChange({
        formState: formState_0,
        submit: true
      });
    }],
    disableValidationOnSubmit: true,
    el: "div",
    fields: clientBlock?.fields,
    initialState: initialState || {},
    onChange: [onChange],
    onSubmit: (formState_1, data) => {
      onFormSubmit(formState_1, data);
      toggleDrawer();
    },
    uuid: uuid(),
    children: [/*#__PURE__*/_jsx(EditDepthProvider, {
      children: /*#__PURE__*/_jsx(Drawer, {
        className: '',
        slug: drawerSlug,
        title: t(`lexical:blocks:inlineBlocks:${formData?.id ? 'edit' : 'create'}`, {
          label: blockDisplayName ?? t('lexical:blocks:inlineBlocks:label')
        }),
        children: initialState ? /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx(RenderFields, {
            fields: clientBlock?.fields,
            forceRender: true,
            parentIndexPath: "",
            parentPath: "",
            parentSchemaPath: schemaFieldsPath,
            permissions: true,
            readOnly: !isEditable
          }), /*#__PURE__*/_jsx(FormSubmit, {
            programmaticSubmit: true,
            children: t('fields:saveChanges')
          })]
        }) : null
      })
    }), CustomBlock ? /*#__PURE__*/_jsx(InlineBlockComponentContext, {
      value: {
        EditButton,
        initialState,
        InlineBlockContainer,
        Label,
        nodeKey,
        RemoveButton
      },
      children: CustomBlock
    }) : /*#__PURE__*/_jsxs(InlineBlockContainer, {
      children: [initialState ? /*#__PURE__*/_jsx(Label, {}) : /*#__PURE__*/_jsx(ShimmerEffect, {
        height: "15px",
        width: "40px"
      }), isEditable ? /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__actions`,
        children: [/*#__PURE__*/_jsx(EditButton, {}), /*#__PURE__*/_jsx(RemoveButton, {})]
      }) : null]
    })]
  });
};
//# sourceMappingURL=index.js.map