'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldLabel, TextareaInput, useConfig, useDocumentInfo, useDocumentTitle, useField, useForm, useLocale, useTranslation } from '@payloadcms/ui';
import { reduceToSerializableFields } from '@payloadcms/ui/shared';
import { formatAdminURL } from 'payload/shared';
import React, { useCallback } from 'react';
import { defaults } from '../../defaults.js';
import { LengthIndicator } from '../../ui/LengthIndicator.js';
const { maxLength: maxLengthDefault, minLength: minLengthDefault } = defaults.description;
export const MetaDescriptionComponent = (props)=>{
    const { field: { label, localized, maxLength: maxLengthFromProps, minLength: minLengthFromProps, required }, hasGenerateDescriptionFn, readOnly } = props;
    const { config: { routes: { api } } } = useConfig();
    const { t } = useTranslation();
    const locale = useLocale();
    const { getData } = useForm();
    const docInfo = useDocumentInfo();
    const { title } = useDocumentTitle();
    const maxLength = maxLengthFromProps || maxLengthDefault;
    const minLength = minLengthFromProps || minLengthDefault;
    const { customComponents: { AfterInput, BeforeInput, Label } = {}, errorMessage, path, setValue, showError, value } = useField();
    const regenerateDescription = useCallback(async ()=>{
        if (!hasGenerateDescriptionFn) {
            return;
        }
        const endpoint = formatAdminURL({
            apiRoute: api,
            path: '/plugin-seo/generate-description'
        });
        const genDescriptionResponse = await fetch(endpoint, {
            body: JSON.stringify({
                id: docInfo.id,
                collectionSlug: docInfo.collectionSlug,
                doc: getData(),
                docPermissions: docInfo.docPermissions,
                globalSlug: docInfo.globalSlug,
                hasPublishPermission: docInfo.hasPublishPermission,
                hasSavePermission: docInfo.hasSavePermission,
                initialData: docInfo.initialData,
                initialState: reduceToSerializableFields(docInfo.initialState ?? {}),
                locale: typeof locale === 'object' ? locale?.code : locale,
                title
            }),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });
        const { result: generatedDescription } = await genDescriptionResponse.json();
        setValue(generatedDescription || '');
    }, [
        hasGenerateDescriptionFn,
        api,
        docInfo.id,
        docInfo.collectionSlug,
        docInfo.docPermissions,
        docInfo.globalSlug,
        docInfo.hasPublishPermission,
        docInfo.hasSavePermission,
        docInfo.initialData,
        docInfo.initialState,
        getData,
        locale,
        setValue,
        title
    ]);
    return /*#__PURE__*/ _jsxs("div", {
        style: {
            marginBottom: '20px'
        },
        children: [
            /*#__PURE__*/ _jsxs("div", {
                style: {
                    marginBottom: '5px',
                    position: 'relative'
                },
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "plugin-seo__field",
                        children: [
                            Label ?? /*#__PURE__*/ _jsx(FieldLabel, {
                                label: label,
                                localized: localized,
                                path: path,
                                required: required
                            }),
                            hasGenerateDescriptionFn && /*#__PURE__*/ _jsxs(React.Fragment, {
                                children: [
                                    "  —  ",
                                    /*#__PURE__*/ _jsx("button", {
                                        disabled: readOnly,
                                        onClick: ()=>{
                                            void regenerateDescription();
                                        },
                                        style: {
                                            background: 'none',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            color: 'currentcolor',
                                            cursor: 'pointer',
                                            padding: 0,
                                            textDecoration: 'underline'
                                        },
                                        type: "button",
                                        children: t('plugin-seo:autoGenerate')
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        style: {
                            color: '#9A9A9A'
                        },
                        children: [
                            t('plugin-seo:lengthTipDescription', {
                                maxLength,
                                minLength
                            }),
                            /*#__PURE__*/ _jsx("a", {
                                href: "https://developers.google.com/search/docs/advanced/appearance/snippet#meta-descriptions",
                                rel: "noopener noreferrer",
                                target: "_blank",
                                children: t('plugin-seo:bestPractices')
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("div", {
                style: {
                    marginBottom: '10px',
                    position: 'relative'
                },
                children: /*#__PURE__*/ _jsx(TextareaInput, {
                    AfterInput: AfterInput,
                    BeforeInput: BeforeInput,
                    Error: errorMessage,
                    onChange: setValue,
                    path: path,
                    readOnly: readOnly,
                    required: required,
                    showError: showError,
                    style: {
                        marginBottom: 0
                    },
                    value: value
                })
            }),
            /*#__PURE__*/ _jsx("div", {
                style: {
                    alignItems: 'center',
                    display: 'flex',
                    width: '100%'
                },
                children: /*#__PURE__*/ _jsx(LengthIndicator, {
                    maxLength: maxLength,
                    minLength: minLength,
                    text: value
                })
            })
        ]
    });
};

//# sourceMappingURL=MetaDescriptionComponent.js.map