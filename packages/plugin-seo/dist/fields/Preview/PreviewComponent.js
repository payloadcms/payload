'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAllFormFields, useConfig, useDocumentInfo, useDocumentTitle, useForm, useLocale, useTranslation } from '@payloadcms/ui';
import { reduceToSerializableFields } from '@payloadcms/ui/shared';
import { formatAdminURL } from 'payload/shared';
import React, { useEffect, useState } from 'react';
export const PreviewComponent = (props)=>{
    const { descriptionPath: descriptionPathFromContext, hasGenerateURLFn, titlePath: titlePathFromContext } = props;
    const { t } = useTranslation();
    const { config: { routes: { api } } } = useConfig();
    const locale = useLocale();
    const [fields] = useAllFormFields();
    const { getData } = useForm();
    const docInfo = useDocumentInfo();
    const { title } = useDocumentTitle();
    const descriptionPath = descriptionPathFromContext || 'meta.description';
    const titlePath = titlePathFromContext || 'meta.title';
    const { [descriptionPath]: { value: metaDescription } = {}, [titlePath]: { value: metaTitle } = {} } = fields;
    const [href, setHref] = useState();
    useEffect(()=>{
        const endpoint = formatAdminURL({
            apiRoute: api,
            path: '/plugin-seo/generate-url'
        });
        const getHref = async ()=>{
            const genURLResponse = await fetch(endpoint, {
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
            const { result: newHref } = await genURLResponse.json();
            setHref(newHref);
        };
        if (hasGenerateURLFn && !href) {
            void getHref();
        }
    }, [
        fields,
        href,
        locale,
        docInfo,
        hasGenerateURLFn,
        getData,
        api,
        title
    ]);
    return /*#__PURE__*/ _jsxs("div", {
        style: {
            marginBottom: '20px'
        },
        children: [
            /*#__PURE__*/ _jsx("div", {
                children: t('plugin-seo:preview')
            }),
            /*#__PURE__*/ _jsx("div", {
                style: {
                    color: '#9A9A9A',
                    marginBottom: '5px'
                },
                children: t('plugin-seo:previewDescription')
            }),
            /*#__PURE__*/ _jsxs("div", {
                style: {
                    background: 'var(--theme-elevation-50)',
                    borderRadius: '5px',
                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                    maxWidth: '600px',
                    padding: '20px',
                    pointerEvents: 'none',
                    width: '100%'
                },
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        children: /*#__PURE__*/ _jsx("a", {
                            href: href,
                            style: {
                                textDecoration: 'none'
                            },
                            children: href || 'https://...'
                        })
                    }),
                    /*#__PURE__*/ _jsx("h4", {
                        style: {
                            margin: 0
                        },
                        children: /*#__PURE__*/ _jsx("a", {
                            href: "/",
                            style: {
                                textDecoration: 'none'
                            },
                            children: metaTitle
                        })
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        style: {
                            margin: 0
                        },
                        children: metaDescription
                    })
                ]
            })
        ]
    });
};

//# sourceMappingURL=PreviewComponent.js.map