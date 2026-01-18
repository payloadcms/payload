'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { PopupList, Translation, useConfig, useDocumentDrawer, useTranslation } from '@payloadcms/ui';
import React, { useEffect } from 'react';
import { useImportExport } from '../ImportExportProvider/index.js';
const baseClass = 'export-list-menu-item';
export const ExportListMenuItem = ({ collectionSlug, exportCollectionSlug })=>{
    const { getEntityConfig } = useConfig();
    const { i18n, t } = useTranslation();
    const currentCollectionConfig = getEntityConfig({
        collectionSlug
    });
    const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
        collectionSlug: exportCollectionSlug
    });
    const { setCollection } = useImportExport();
    // Set collection and selected items on mount or when selection changes
    useEffect(()=>{
        setCollection(currentCollectionConfig.slug ?? '');
    }, [
        currentCollectionConfig,
        setCollection
    ]);
    return /*#__PURE__*/ _jsxs(PopupList.Button, {
        className: baseClass,
        children: [
            /*#__PURE__*/ _jsx(DocumentDrawerToggler, {
                children: /*#__PURE__*/ _jsx(Translation, {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    i18nKey: "plugin-import-export:exportDocumentLabel",
                    t: t,
                    variables: {
                        label: getTranslation(currentCollectionConfig.labels.plural, i18n)
                    }
                })
            }),
            /*#__PURE__*/ _jsx(DocumentDrawer, {})
        ]
    });
};

//# sourceMappingURL=index.js.map