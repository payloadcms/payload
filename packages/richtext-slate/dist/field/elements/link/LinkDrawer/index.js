'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Drawer, EditDepthProvider, Form, FormSubmit, RenderFields, useDocumentInfo, useEditDepth, useHotkey, useServerFunctions, useTranslation } from '@payloadcms/ui';
import React, { useCallback, useRef } from 'react';
import { linkFieldsSchemaPath } from '../shared.js';
import './index.scss';
const baseClass = 'rich-text-link-edit-modal';
export const LinkDrawer = ({ drawerSlug, fields, handleModalSubmit, initialState, schemaPath })=>{
    const { t } = useTranslation();
    const fieldMapPath = `${schemaPath}.${linkFieldsSchemaPath}`;
    const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo();
    const { getFormState } = useServerFunctions();
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
            schemaPath: fieldMapPath ?? ''
        });
        return state;
    }, [
        getFormState,
        id,
        collectionSlug,
        getDocPreferences,
        globalSlug,
        fieldMapPath
    ]);
    return /*#__PURE__*/ _jsx(EditDepthProvider, {
        children: /*#__PURE__*/ _jsx(Drawer, {
            className: baseClass,
            slug: drawerSlug,
            title: t('fields:editLink'),
            children: /*#__PURE__*/ _jsxs(Form, {
                beforeSubmit: [
                    onChange
                ],
                disableValidationOnSubmit: true,
                initialState: initialState,
                onChange: [
                    onChange
                ],
                onSubmit: handleModalSubmit,
                children: [
                    /*#__PURE__*/ _jsx(RenderFields, {
                        fields: fields,
                        forceRender: true,
                        parentIndexPath: "",
                        parentPath: '',
                        parentSchemaPath: "",
                        permissions: true,
                        readOnly: false
                    }),
                    /*#__PURE__*/ _jsx(LinkSubmit, {})
                ]
            })
        })
    });
};
const LinkSubmit = ()=>{
    const { t } = useTranslation();
    const ref = useRef(null);
    const editDepth = useEditDepth();
    useHotkey({
        cmdCtrlKey: true,
        editDepth,
        keyCodes: [
            's'
        ]
    }, (e)=>{
        e.preventDefault();
        e.stopPropagation();
        if (ref?.current) {
            ref.current.click();
        }
    });
    return /*#__PURE__*/ _jsx(FormSubmit, {
        ref: ref,
        children: t('general:submit')
    });
};

//# sourceMappingURL=index.js.map