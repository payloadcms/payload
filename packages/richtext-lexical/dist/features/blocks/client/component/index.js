'use client';

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { getTranslation } from '@payloadcms/translations';
import { Button, Collapsible, Drawer, EditDepthProvider, ErrorPill, Form, formatDrawerSlug, FormSubmit, Pill, RenderFields, SectionTitle, useConfig, useDocumentForm, useDocumentInfo, useEditDepth, useFormSubmitted, useServerFunctions, useTranslation } from '@payloadcms/ui';
import { abortAndIgnore } from '@payloadcms/ui/shared';
import { $getNodeByKey } from 'lexical';
import { deepCopyObjectSimpleWithoutReactComponents, reduceFieldsToValues } from 'payload/shared';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js';
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js';
import { $isBlockNode } from '../nodes/BlocksNode.js';
import { BlockContent } from './BlockContent.js';
import { removeEmptyArrayValues } from './removeEmptyArrayValues.js';
export const BlockComponent = props => {
  const {
    cacheBuster,
    className: baseClass,
    formData,
    nodeKey
  } = props;
  const submitted = useFormSubmitted();
  const {
    id,
    collectionSlug,
    globalSlug
  } = useDocumentInfo();
  const {
    fieldProps: {
      featureClientSchemaMap,
      field: parentLexicalRichTextField,
      initialLexicalFormState,
      schemaPath
    },
    uuid: uuidFromContext
  } = useEditorConfigContext();
  const {
    fields: parentDocumentFields
  } = useDocumentForm();
  const onChangeAbortControllerRef = useRef(new AbortController());
  const editDepth = useEditDepth();
  const [errorCount, setErrorCount] = React.useState(0);
  const {
    config
  } = useConfig();
  const drawerSlug = formatDrawerSlug({
    slug: `lexical-blocks-create-${uuidFromContext}-${formData.id}`,
    depth: editDepth
  });
  const {
    toggleDrawer
  } = useLexicalDrawer(drawerSlug);
  // Used for saving collapsed to preferences (and gettin' it from there again)
  // Remember, these preferences are scoped to the whole document, not just this form. This
  // is important to consider for the data path used in setDocFieldPreferences
  const {
    getDocPreferences,
    setDocFieldPreferences
  } = useDocumentInfo();
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const blockType = formData.blockType;
  const {
    getFormState
  } = useServerFunctions();
  const schemaFieldsPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockType}.fields`;
  const [initialState, setInitialState] = React.useState(() => {
    // Initial form state that was calculated server-side. May have stale values
    const cachedFormState = initialLexicalFormState?.[formData.id]?.formState;
    if (!cachedFormState) {
      return false;
    }
    // Merge current formData values into the cached form state
    // This ensures that when the component remounts (e.g., due to view changes), we don't lose user edits
    const mergedState = Object.fromEntries(Object.entries(cachedFormState).map(([fieldName, fieldState]) => [fieldName, fieldName in formData ? {
      ...fieldState,
      initialValue: formData[fieldName],
      value: formData[fieldName]
    } : fieldState]));
    // Manually add blockName, as it's not part of cachedFormState
    mergedState.blockName = {
      initialValue: formData.blockName,
      passesCondition: true,
      valid: true,
      value: formData.blockName
    };
    return mergedState;
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
  initialState?.['_components']?.customComponents?.BlockLabel ?? undefined);
  const [CustomBlock, setCustomBlock] = React.useState(
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  initialState?.['_components']?.customComponents?.Block ?? undefined);
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
        operation: 'update',
        readOnly: !isEditable,
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: abortController.signal
      });
      if (state) {
        state.blockName = {
          initialValue: formData.blockName,
          passesCondition: true,
          valid: true,
          value: formData.blockName
        };
        const newFormStateData = reduceFieldsToValues(deepCopyObjectSimpleWithoutReactComponents(state, {
          excludeFiles: true
        }), true);
        // Things like default values may come back from the server => update the node with the new data
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (node && $isBlockNode(node)) {
            const newData = newFormStateData;
            newData.blockType = blockType;
            node.setFields(newData, true);
          }
        });
        setInitialState(state);
        setCustomLabel(state._components?.customComponents?.BlockLabel ?? undefined);
        setCustomBlock(state._components?.customComponents?.Block ?? undefined);
      }
    };
    if (formData && !initialState) {
      void awaitInitialState();
    }
    return () => {
      abortAndIgnore(abortController);
    };
  }, [getFormState, schemaFieldsPath, isEditable, id, formData, editor, nodeKey, initialState, collectionSlug, globalSlug, getDocPreferences, parentDocumentFields, blockType]);
  const [isCollapsed, setIsCollapsed] = React.useState(initialLexicalFormState?.[formData.id]?.collapsed ?? false);
  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockType}`;
  const clientSchemaMap = featureClientSchemaMap['blocks'];
  const blocksField = clientSchemaMap?.[componentMapRenderedBlockPath]?.[0];
  const clientBlock = blocksField.blockReferences ? typeof blocksField?.blockReferences?.[0] === 'string' ? config.blocksMap[blocksField?.blockReferences?.[0]] : blocksField?.blockReferences?.[0] : blocksField?.blocks?.[0];
  const {
    i18n,
    t
  } = useTranslation();
  const onChange = useCallback(async ({
    formState: prevFormState,
    submit
  }) => {
    abortAndIgnore(onChangeAbortControllerRef.current);
    const controller = new AbortController();
    onChangeAbortControllerRef.current = controller;
    const {
      state: newFormState
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
    if (!newFormState) {
      return prevFormState;
    }
    if (prevFormState.blockName) {
      newFormState.blockName = prevFormState.blockName;
    }
    const newFormStateData_0 = reduceFieldsToValues(removeEmptyArrayValues({
      fields: deepCopyObjectSimpleWithoutReactComponents(newFormState, {
        excludeFiles: true
      })
    }), true);
    setTimeout(() => {
      editor.update(() => {
        const node_0 = $getNodeByKey(nodeKey);
        if (node_0 && $isBlockNode(node_0)) {
          const newData_0 = newFormStateData_0;
          newData_0.blockType = blockType;
          node_0.setFields(newData_0, true);
        }
      });
    }, 0);
    if (submit) {
      setCustomLabel(newFormState._components?.customComponents?.BlockLabel ?? undefined);
      setCustomBlock(newFormState._components?.customComponents?.Block ?? undefined);
      let rowErrorCount = 0;
      for (const formField of Object.values(newFormState)) {
        if (formField?.valid === false) {
          rowErrorCount++;
        }
      }
      setErrorCount(rowErrorCount);
    }
    return newFormState;
  }, [getFormState, id, collectionSlug, getDocPreferences, globalSlug, schemaFieldsPath, blockType, parentDocumentFields, isEditable, editor, nodeKey]);
  useEffect(() => {
    return () => {
      abortAndIgnore(onChangeAbortControllerRef.current);
    };
  }, []);
  const removeBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove();
    });
  }, [editor, nodeKey]);
  const blockDisplayName = clientBlock?.labels?.singular ? getTranslation(clientBlock.labels.singular, i18n) : clientBlock?.slug;
  const onCollapsedChange = useCallback(changedCollapsed => {
    void getDocPreferences().then(currentDocPreferences => {
      const currentFieldPreferences = currentDocPreferences?.fields?.[parentLexicalRichTextField.name];
      const collapsedArray = currentFieldPreferences?.collapsed;
      const newCollapsed = collapsedArray && collapsedArray?.length ? collapsedArray : [];
      if (changedCollapsed) {
        if (!newCollapsed.includes(formData.id)) {
          newCollapsed.push(formData.id);
        }
      } else {
        if (newCollapsed.includes(formData.id)) {
          newCollapsed.splice(newCollapsed.indexOf(formData.id), 1);
        }
      }
      setDocFieldPreferences(parentLexicalRichTextField.name, {
        collapsed: newCollapsed,
        hello: 'hi'
      });
    });
  }, [getDocPreferences, parentLexicalRichTextField.name, setDocFieldPreferences, formData.id]);
  const EditButton = useMemo(() => () => /*#__PURE__*/_jsx(Button, {
    buttonStyle: "icon-label",
    className: `${baseClass}__editButton`,
    disabled: !isEditable,
    el: "button",
    icon: "edit",
    onClick: e => {
      e.preventDefault();
      e.stopPropagation();
      toggleDrawer();
      return false;
    },
    onMouseDown: e_0 => {
      // Needed to preserve lexical selection for toggleDrawer lexical selection restore.
      // I believe this is needed due to this button (usually) being inside of a collapsible.
      e_0.preventDefault();
    },
    round: true,
    size: "small",
    tooltip: t('lexical:blocks:inlineBlocks:edit', {
      label: blockDisplayName
    })
  }), [baseClass, isEditable, t, blockDisplayName, toggleDrawer]);
  const RemoveButton = useMemo(() => () => /*#__PURE__*/_jsx(Button, {
    buttonStyle: "icon-label",
    className: `${baseClass}__removeButton`,
    disabled: !isEditable,
    icon: "x",
    onClick: e_1 => {
      e_1.preventDefault();
      removeBlock();
    },
    round: true,
    tooltip: "Remove Block"
  }), [baseClass, isEditable, removeBlock]);
  const BlockCollapsible = useMemo(() => ({
    Actions,
    children,
    className,
    collapsibleProps,
    disableBlockName,
    editButton,
    errorCount: errorCount_0,
    fieldHasErrors,
    Label,
    Pill: CustomPill,
    removeButton
  }) => {
    return /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__container ${baseClass}-${blockType}`,
      children: /*#__PURE__*/_jsx(Collapsible, {
        className: [`${baseClass}__row`, fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`, className].filter(Boolean).join(' '),
        collapsibleStyle: fieldHasErrors ? 'error' : 'default',
        header: /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__block-header`,
          children: [typeof Label !== 'undefined' ? Label : typeof CustomLabel !== 'undefined' ? CustomLabel : /*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__block-label`,
            children: [typeof CustomPill !== 'undefined' ? CustomPill : /*#__PURE__*/_jsx(Pill, {
              className: `${baseClass}__block-pill ${baseClass}__block-pill-${blockType}`,
              pillStyle: "white",
              size: "small",
              children: blockDisplayName ?? blockType
            }), !disableBlockName && !clientBlock?.admin?.disableBlockName && /*#__PURE__*/_jsx(SectionTitle, {
              path: "blockName",
              readOnly: !isEditable
            }), fieldHasErrors && /*#__PURE__*/_jsx(ErrorPill, {
              count: errorCount_0 ?? 0,
              i18n: i18n,
              withMessage: true
            })]
          }), /*#__PURE__*/_jsx("div", {
            className: `${baseClass}__block-actions`,
            children: typeof Actions !== 'undefined' ? Actions : /*#__PURE__*/_jsxs(_Fragment, {
              children: [CustomBlock && editButton !== false || !CustomBlock && editButton ? /*#__PURE__*/_jsx(EditButton, {}) : null, removeButton !== false && isEditable ? /*#__PURE__*/_jsx(RemoveButton, {}) : null]
            })
          })]
        }),
        isCollapsed: isCollapsed,
        onToggle: incomingCollapsedState => {
          onCollapsedChange(incomingCollapsedState);
          setIsCollapsed(incomingCollapsedState);
        },
        ...(collapsibleProps || {}),
        children: children
      }, 0)
    });
  }, [CustomBlock, CustomLabel, EditButton, RemoveButton, blockDisplayName, baseClass, clientBlock?.admin?.disableBlockName, blockType, i18n, isCollapsed, onCollapsedChange, isEditable]);
  const blockID = formData?.id;
  const BlockDrawer = useMemo(() => () => /*#__PURE__*/_jsx(EditDepthProvider, {
    children: /*#__PURE__*/_jsx(Drawer, {
      className: '',
      slug: drawerSlug,
      title: t(`lexical:blocks:inlineBlocks:${blockID ? 'edit' : 'create'}`, {
        label: blockDisplayName ?? t('lexical:blocks:inlineBlocks:label')
      }),
      children: initialState ? /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx(RenderFields, {
          fields: clientBlock?.fields ?? [],
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
  }), [initialState, drawerSlug, blockID, blockDisplayName, t, isEditable, clientBlock?.fields, schemaFieldsPath]);
  // Memoized Form JSX
  const Block = useMemo(() => {
    if (!initialState) {
      return null;
    }
    return /*#__PURE__*/_jsx(Form, {
      beforeSubmit: [async ({
        formState
      }) => {
        // This is only called when form is submitted from drawer - usually only the case if the block has a custom Block component
        return await onChange({
          formState,
          submit: true
        });
      }],
      el: "div",
      fields: clientBlock?.fields ?? [],
      initialState: initialState,
      onChange: [onChange],
      onSubmit: (formState_0, newData_1) => {
        // This is only called when form is submitted from drawer - usually only the case if the block has a custom Block component
        newData_1.blockType = blockType;
        editor.update(() => {
          const node_1 = $getNodeByKey(nodeKey);
          if (node_1 && $isBlockNode(node_1)) {
            node_1.setFields(newData_1, true);
          }
        });
        toggleDrawer();
      },
      submitted: submitted,
      uuid: uuid(),
      children: /*#__PURE__*/_jsx(BlockContent, {
        baseClass: baseClass,
        BlockDrawer: BlockDrawer,
        Collapsible: BlockCollapsible,
        CustomBlock: CustomBlock,
        EditButton: EditButton,
        errorCount: errorCount,
        formSchema: clientBlock?.fields ?? [],
        initialState: initialState,
        nodeKey: nodeKey,
        RemoveButton: RemoveButton
      })
    });
  }, [BlockCollapsible, BlockDrawer, CustomBlock, blockType, RemoveButton, EditButton, baseClass, editor, errorCount, toggleDrawer, clientBlock?.fields,
  // DO NOT ADD FORMDATA HERE! Adding formData will kick you out of sub block editors while writing.
  initialState, nodeKey, onChange, submitted]);
  if (!clientBlock) {
    return /*#__PURE__*/_jsx(BlockCollapsible, {
      disableBlockName: true,
      fieldHasErrors: true,
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}-not-found`,
        children: ["Error: Block '", blockType, "' not found in the config but exists in the lexical data"]
      })
    });
  }
  return Block;
};
//# sourceMappingURL=index.js.map