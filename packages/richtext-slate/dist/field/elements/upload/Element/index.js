'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { Button, DrawerToggler, File, useConfig, useDocumentDrawer, useDrawerSlug, useListDrawer, usePayloadAPI, useTranslation } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import React, { useCallback, useReducer, useState } from 'react';
import { Transforms } from 'slate';
import { ReactEditor, useFocused, useSelected, useSlateStatic } from 'slate-react';
import { useElement } from '../../../providers/ElementProvider.js';
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition.js';
import { uploadFieldsSchemaPath, uploadName } from '../shared.js';
import './index.scss';
import { UploadDrawer } from './UploadDrawer/index.js';
const baseClass = 'rich-text-upload';
const initialParams = {
    depth: 0
};
const UploadElementComponent = ({ enabledCollectionSlugs })=>{
    const { attributes, children, element: { relationTo, value }, element, fieldProps, schemaPath } = useElement();
    const { config: { routes: { api }, serverURL }, getEntityConfig } = useConfig();
    const { i18n, t } = useTranslation();
    const [cacheBust, dispatchCacheBust] = useReducer((state)=>state + 1, 0);
    const [relatedCollection, setRelatedCollection] = useState(()=>getEntityConfig({
            collectionSlug: relationTo
        }));
    const drawerSlug = useDrawerSlug('upload-drawer');
    const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer }] = useListDrawer({
        collectionSlugs: enabledCollectionSlugs,
        selectedCollection: relatedCollection.slug
    });
    const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
        id: value?.id,
        collectionSlug: relatedCollection.slug
    });
    const editor = useSlateStatic();
    const selected = useSelected();
    const focused = useFocused();
    // Get the referenced document
    const [{ data }, { setParams }] = usePayloadAPI(formatAdminURL({
        apiRoute: api,
        path: `/${relatedCollection.slug}/${value?.id}`,
        serverURL
    }), {
        initialParams
    });
    const thumbnailSRC = data?.thumbnailURL || data?.url;
    const removeUpload = useCallback(()=>{
        const elementPath = ReactEditor.findPath(editor, element);
        Transforms.removeNodes(editor, {
            at: elementPath
        });
    }, [
        editor,
        element
    ]);
    const updateUpload = useCallback((json)=>{
        const { doc } = json;
        const newNode = {
            fields: doc
        };
        const elementPath = ReactEditor.findPath(editor, element);
        Transforms.setNodes(editor, newNode, {
            at: elementPath
        });
        setParams({
            ...initialParams,
            cacheBust
        });
        dispatchCacheBust();
        closeDrawer();
    }, [
        editor,
        element,
        setParams,
        cacheBust,
        closeDrawer
    ]);
    const swapUpload = useCallback(({ collectionSlug, doc })=>{
        const newNode = {
            type: uploadName,
            children: [
                {
                    text: ' '
                }
            ],
            relationTo: collectionSlug,
            value: {
                id: doc.id
            }
        };
        const elementPath = ReactEditor.findPath(editor, element);
        setRelatedCollection(getEntityConfig({
            collectionSlug
        }));
        Transforms.setNodes(editor, newNode, {
            at: elementPath
        });
        dispatchCacheBust();
        closeListDrawer();
    }, [
        closeListDrawer,
        editor,
        element,
        getEntityConfig
    ]);
    const relatedFieldSchemaPath = `${uploadFieldsSchemaPath}.${relatedCollection.slug}`;
    const customFieldsMap = fieldProps.componentMap[relatedFieldSchemaPath];
    const alt = data?.alt || data?.filename || '';
    return /*#__PURE__*/ _jsxs("div", {
        className: [
            baseClass,
            selected && focused && `${baseClass}--selected`
        ].filter(Boolean).join(' '),
        contentEditable: false,
        ...attributes,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: `${baseClass}__card`,
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: `${baseClass}__topRow`,
                        children: [
                            /*#__PURE__*/ _jsx("div", {
                                className: `${baseClass}__thumbnail`,
                                children: thumbnailSRC ? /*#__PURE__*/ _jsx("img", {
                                    alt: alt,
                                    src: thumbnailSRC
                                }) : /*#__PURE__*/ _jsx(File, {})
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: `${baseClass}__topRowRightPanel`,
                                children: [
                                    /*#__PURE__*/ _jsx("div", {
                                        className: `${baseClass}__collectionLabel`,
                                        children: getTranslation(relatedCollection.labels.singular, i18n)
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: `${baseClass}__actions`,
                                        children: [
                                            Boolean(customFieldsMap) && /*#__PURE__*/ _jsxs(_Fragment, {
                                                children: [
                                                    /*#__PURE__*/ _jsx(DrawerToggler, {
                                                        className: `${baseClass}__upload-drawer-toggler`,
                                                        disabled: fieldProps?.field?.admin?.readOnly,
                                                        slug: drawerSlug,
                                                        children: /*#__PURE__*/ _jsx(Button, {
                                                            buttonStyle: "icon-label",
                                                            el: "div",
                                                            icon: "edit",
                                                            onClick: (e)=>{
                                                                e.preventDefault();
                                                            },
                                                            round: true,
                                                            tooltip: t('fields:editRelationship')
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsx(UploadDrawer, {
                                                        drawerSlug,
                                                        element,
                                                        fieldProps,
                                                        relatedCollection,
                                                        schemaPath
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsx(ListDrawerToggler, {
                                                className: `${baseClass}__list-drawer-toggler`,
                                                disabled: fieldProps?.field?.admin?.readOnly,
                                                children: /*#__PURE__*/ _jsx(Button, {
                                                    buttonStyle: "icon-label",
                                                    disabled: fieldProps?.field?.admin?.readOnly,
                                                    el: "div",
                                                    icon: "swap",
                                                    onClick: ()=>{
                                                    // do nothing
                                                    },
                                                    round: true,
                                                    tooltip: t('fields:swapUpload')
                                                })
                                            }),
                                            /*#__PURE__*/ _jsx(Button, {
                                                buttonStyle: "icon-label",
                                                className: `${baseClass}__removeButton`,
                                                disabled: fieldProps?.field?.admin?.readOnly,
                                                icon: "x",
                                                onClick: (e)=>{
                                                    e.preventDefault();
                                                    removeUpload();
                                                },
                                                round: true,
                                                tooltip: t('fields:removeUpload')
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: `${baseClass}__bottomRow`,
                        children: /*#__PURE__*/ _jsx(DocumentDrawerToggler, {
                            className: `${baseClass}__doc-drawer-toggler`,
                            children: /*#__PURE__*/ _jsx("strong", {
                                children: data?.filename
                            })
                        })
                    })
                ]
            }),
            children,
            value?.id && /*#__PURE__*/ _jsx(DocumentDrawer, {
                onSave: updateUpload
            }),
            /*#__PURE__*/ _jsx(ListDrawer, {
                onSelect: swapUpload
            })
        ]
    });
};
export const UploadElement = (props)=>{
    return /*#__PURE__*/ _jsx(EnabledRelationshipsCondition, {
        ...props,
        uploads: true,
        children: /*#__PURE__*/ _jsx(UploadElementComponent, {
            ...props
        })
    });
};

//# sourceMappingURL=index.js.map