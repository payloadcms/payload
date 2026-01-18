'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { Button, Modal, Pill, PopupList, useConfig, useDocumentInfo, useDocumentTitle, useModal, useTranslation } from '@payloadcms/ui';
import { drawerZBase, useDrawerDepth } from '@payloadcms/ui/elements/Drawer';
import React from 'react';
import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js';
import './index.scss';
export const assignTenantModalSlug = 'assign-tenant-field-modal';
const baseClass = 'assign-tenant-field-modal';
export const AssignTenantFieldTrigger = ()=>{
    const { openModal } = useModal();
    const { t } = useTranslation();
    const { options } = useTenantSelection();
    if (options.length <= 1) {
        return null;
    }
    return /*#__PURE__*/ _jsx(_Fragment, {
        children: /*#__PURE__*/ _jsx(PopupList.Button, {
            onClick: ()=>openModal(assignTenantModalSlug),
            children: t('plugin-multi-tenant:assign-tenant-button-label')
        })
    });
};
export const AssignTenantFieldModal = ({ afterModalClose, afterModalOpen, children, onCancel, onConfirm })=>{
    const editDepth = useDrawerDepth();
    const { i18n, t } = useTranslation();
    const { collectionSlug } = useDocumentInfo();
    const { title } = useDocumentTitle();
    const { getEntityConfig } = useConfig();
    const collectionConfig = getEntityConfig({
        collectionSlug
    });
    const { closeModal, isModalOpen: isModalOpenFn } = useModal();
    const isModalOpen = isModalOpenFn(assignTenantModalSlug);
    const wasModalOpenRef = React.useRef(isModalOpen);
    const onModalConfirm = React.useCallback(()=>{
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
        closeModal(assignTenantModalSlug);
    }, [
        onConfirm,
        closeModal
    ]);
    const onModalCancel = React.useCallback(()=>{
        if (typeof onCancel === 'function') {
            onCancel();
        }
        closeModal(assignTenantModalSlug);
    }, [
        onCancel,
        closeModal
    ]);
    React.useEffect(()=>{
        if (wasModalOpenRef.current && !isModalOpen) {
            // modal was open, and now is closed
            if (typeof afterModalClose === 'function') {
                afterModalClose();
            }
        }
        if (!wasModalOpenRef.current && isModalOpen) {
            // modal was closed, and now is open
            if (typeof afterModalOpen === 'function') {
                afterModalOpen();
            }
        }
        wasModalOpenRef.current = isModalOpen;
    }, [
        isModalOpen,
        onCancel,
        afterModalClose,
        afterModalOpen
    ]);
    if (!collectionConfig) {
        return null;
    }
    return /*#__PURE__*/ _jsxs(Modal, {
        className: baseClass,
        slug: assignTenantModalSlug,
        style: {
            zIndex: drawerZBase + editDepth
        },
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: `${baseClass}__bg`
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: `${baseClass}__wrapper`,
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: `${baseClass}__header`,
                        children: [
                            /*#__PURE__*/ _jsx("h3", {
                                children: t('plugin-multi-tenant:assign-tenant-modal-title', {
                                    title
                                })
                            }),
                            /*#__PURE__*/ _jsx(Pill, {
                                className: `${baseClass}__collection-pill`,
                                size: "small",
                                children: getTranslation(collectionConfig.labels.singular, i18n)
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: `${baseClass}__content`,
                        children: children
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: `${baseClass}__actions`,
                        children: [
                            /*#__PURE__*/ _jsx(Button, {
                                buttonStyle: "secondary",
                                margin: false,
                                onClick: onModalCancel,
                                children: t('general:cancel')
                            }),
                            /*#__PURE__*/ _jsx(Button, {
                                margin: false,
                                onClick: onModalConfirm,
                                children: t('general:confirm')
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

//# sourceMappingURL=index.client.js.map