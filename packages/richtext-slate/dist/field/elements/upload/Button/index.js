'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useListDrawer, useTranslation } from '@payloadcms/ui';
import React, { Fragment, useCallback } from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import { UploadIcon } from '../../../icons/Upload/index.js';
import { ElementButton } from '../../Button.js';
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition.js';
import { injectVoidElement } from '../../injectVoid.js';
import './index.scss';
const baseClass = 'upload-rich-text-button';
const insertUpload = (editor, { relationTo, value })=>{
    const text = {
        text: ' '
    };
    const upload = {
        type: 'upload',
        children: [
            text
        ],
        relationTo,
        value
    };
    injectVoidElement(editor, upload);
    ReactEditor.focus(editor);
};
const UploadButton = ({ enabledCollectionSlugs })=>{
    const { t } = useTranslation();
    const editor = useSlate();
    const [ListDrawer, ListDrawerToggler, { closeDrawer }] = useListDrawer({
        collectionSlugs: enabledCollectionSlugs,
        uploads: true
    });
    const onSelect = useCallback(({ collectionSlug, doc })=>{
        insertUpload(editor, {
            relationTo: collectionSlug,
            value: {
                id: doc.id
            }
        });
        closeDrawer();
    }, [
        editor,
        closeDrawer
    ]);
    return /*#__PURE__*/ _jsxs(Fragment, {
        children: [
            /*#__PURE__*/ _jsx(ListDrawerToggler, {
                children: /*#__PURE__*/ _jsx(ElementButton, {
                    className: baseClass,
                    el: "div",
                    format: "upload",
                    onClick: ()=>{
                    // do nothing
                    },
                    tooltip: t('fields:addUpload'),
                    children: /*#__PURE__*/ _jsx(UploadIcon, {})
                })
            }),
            /*#__PURE__*/ _jsx(ListDrawer, {
                onSelect: onSelect
            })
        ]
    });
};
export const UploadElementButton = (props)=>{
    return /*#__PURE__*/ _jsx(EnabledRelationshipsCondition, {
        ...props,
        uploads: true,
        children: /*#__PURE__*/ _jsx(UploadButton, {
            ...props
        })
    });
};

//# sourceMappingURL=index.js.map