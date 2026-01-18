'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { Drawer, EditDepthProvider, Form, FormSubmit, RenderFields, useConfig, useDocumentInfo, useLocale, useModal, useServerFunctions, useTranslation } from '@payloadcms/ui';
import { deepCopyObject } from 'payload/shared';
import React, { useCallback, useEffect, useState } from 'react';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic } from 'slate-react';
import { uploadFieldsSchemaPath } from '../../shared.js';
export const UploadDrawer = (props)=>{
    const editor = useSlateStatic();
    const { drawerSlug, element, fieldProps, relatedCollection, schemaPath } = props;
    const { i18n, t } = useTranslation();
    const { code: locale } = useLocale();
    const { closeModal } = useModal();
    const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo();
    const { getFormState } = useServerFunctions();
    const [initialState, setInitialState] = useState({});
    const { componentMap } = fieldProps;
    const relatedFieldSchemaPath = `${uploadFieldsSchemaPath}.${relatedCollection.slug}`;
    const fields = componentMap[relatedFieldSchemaPath];
    const { config } = useConfig();
    const handleUpdateEditData = useCallback((_, data)=>{
        const newNode = {
            fields: data
        };
        const elementPath = ReactEditor.findPath(editor, element);
        Transforms.setNodes(editor, newNode, {
            at: elementPath
        });
        closeModal(drawerSlug);
    }, [
        closeModal,
        editor,
        element,
        drawerSlug
    ]);
    useEffect(()=>{
        const data = deepCopyObject(element?.fields || {});
        const awaitInitialState = async ()=>{
            const { state } = await getFormState({
                id,
                collectionSlug,
                data,
                docPermissions: {
                    fields: true
                },
                docPreferences: await getDocPreferences(),
                globalSlug,
                operation: 'update',
                renderAllFields: true,
                schemaPath: `${schemaPath}.${uploadFieldsSchemaPath}.${relatedCollection.slug}`
            });
            setInitialState(state);
        };
        void awaitInitialState();
    }, [
        config,
        element?.fields,
        locale,
        t,
        collectionSlug,
        id,
        schemaPath,
        relatedCollection.slug,
        getFormState,
        globalSlug,
        getDocPreferences
    ]);
    const onChange = useCallback(async ({ formState: prevFormState })=>{
        const { state } = await getFormState({
            id,
            collectionSlug,
            docPermissions: {
                fields: true
            },
            docPreferences: await getDocPreferences(),
            formState: prevFormState,
            globalSlug,
            operation: 'update',
            schemaPath: `${schemaPath}.${uploadFieldsSchemaPath}.${relatedCollection.slug}`
        });
        return state;
    }, [
        getFormState,
        id,
        collectionSlug,
        getDocPreferences,
        globalSlug,
        schemaPath,
        relatedCollection.slug
    ]);
    return /*#__PURE__*/ _jsx(EditDepthProvider, {
        children: /*#__PURE__*/ _jsx(Drawer, {
            slug: drawerSlug,
            title: t('general:editLabel', {
                label: getTranslation(relatedCollection.labels.singular, i18n)
            }),
            children: /*#__PURE__*/ _jsxs(Form, {
                beforeSubmit: [
                    onChange
                ],
                disableValidationOnSubmit: true,
                initialState: initialState,
                onChange: [
                    onChange
                ],
                onSubmit: handleUpdateEditData,
                children: [
                    /*#__PURE__*/ _jsx(RenderFields, {
                        fields: Array.isArray(fields) ? fields : [],
                        parentIndexPath: "",
                        parentPath: "",
                        parentSchemaPath: "",
                        permissions: true,
                        readOnly: false
                    }),
                    /*#__PURE__*/ _jsx(FormSubmit, {
                        children: t('fields:saveChanges')
                    })
                ]
            })
        })
    });
};

//# sourceMappingURL=index.js.map