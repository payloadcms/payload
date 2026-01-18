'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ConfirmationModal, Popup, PopupList, toast, useConfig, useLocale, useModal, useTranslation } from '@payloadcms/ui';
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React, { useCallback, useMemo, useState } from 'react';
import { ReindexButtonLabel } from './ReindexButtonLabel/index.js';
const confirmReindexModalSlug = 'confirm-reindex-modal';
export const ReindexButtonClient = ({ collectionLabels, searchCollections, searchSlug })=>{
    const { openModal } = useModal();
    const { config } = useConfig();
    const { i18n: { t } } = useTranslation();
    const locale = useLocale();
    const router = useRouter();
    const [reindexCollections, setReindexCollections] = useState([]);
    const openConfirmModal = useCallback(()=>openModal(confirmReindexModalSlug), [
        openModal
    ]);
    const handleReindexSubmit = useCallback(async ()=>{
        if (!reindexCollections.length) {
            return;
        }
        try {
            const res = await fetch(formatAdminURL({
                apiRoute: config.routes.api,
                path: `/${searchSlug}/reindex?locale=${locale.code}`
            }), {
                body: JSON.stringify({
                    collections: reindexCollections
                }),
                method: 'POST'
            });
            const { message } = await res.json();
            if (!res.ok) {
                toast.error(message);
            } else {
                toast.success(message);
                return router.refresh();
            }
        } catch (_err) {
        // swallow error, toast shown above
        } finally{
            setReindexCollections([]);
        }
    }, [
        reindexCollections,
        router,
        searchSlug,
        locale,
        config
    ]);
    const handleShowConfirmModal = useCallback((collections = searchCollections)=>{
        setReindexCollections(typeof collections === 'string' ? [
            collections
        ] : collections);
        openConfirmModal();
    }, [
        openConfirmModal,
        searchCollections
    ]);
    const handlePopupButtonClick = useCallback((closePopup, slug)=>{
        closePopup();
        handleShowConfirmModal(slug);
    }, [
        handleShowConfirmModal
    ]);
    const getPluralizedLabel = useCallback((slug)=>{
        const label = collectionLabels[slug];
        if (typeof label === 'string') {
            return label;
        } else {
            return label && Object.hasOwn(label, locale.code) ? label[locale.code] : slug;
        }
    }, [
        collectionLabels,
        locale.code
    ]);
    const pluralizedLabels = useMemo(()=>{
        return searchCollections.reduce((acc, slug)=>{
            const label = getPluralizedLabel(slug);
            if (label) {
                acc[slug] = label;
            }
            return acc;
        }, {});
    }, [
        searchCollections,
        getPluralizedLabel
    ]);
    const selectedAll = reindexCollections.length === searchCollections.length;
    const selectedLabels = reindexCollections.map((slug)=>pluralizedLabels[slug]).join(', ');
    const modalTitle = selectedAll ? t('general:confirmReindexAll') : t('general:confirmReindex', {
        collections: selectedLabels
    });
    const modalDescription = selectedAll ? t('general:confirmReindexDescriptionAll') : t('general:confirmReindexDescription', {
        collections: selectedLabels
    });
    return /*#__PURE__*/ _jsxs("div", {
        children: [
            /*#__PURE__*/ _jsx(Popup, {
                button: /*#__PURE__*/ _jsx(ReindexButtonLabel, {}),
                render: ({ close })=>/*#__PURE__*/ _jsxs(PopupList.ButtonGroup, {
                        children: [
                            searchCollections.map((collectionSlug)=>/*#__PURE__*/ _jsx(PopupList.Button, {
                                    onClick: ()=>handlePopupButtonClick(close, collectionSlug),
                                    children: pluralizedLabels[collectionSlug]
                                }, collectionSlug)),
                            /*#__PURE__*/ _jsx(PopupList.Button, {
                                onClick: ()=>handlePopupButtonClick(close),
                                children: t('general:allCollections')
                            })
                        ]
                    }),
                showScrollbar: true,
                size: "large",
                verticalAlign: "bottom"
            }),
            /*#__PURE__*/ _jsx(ConfirmationModal, {
                body: modalDescription,
                heading: modalTitle,
                modalSlug: confirmReindexModalSlug,
                onConfirm: handleReindexSubmit
            })
        ]
    });
};

//# sourceMappingURL=index.client.js.map