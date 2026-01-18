'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pill, RelationshipField, useDocumentInfo, useField, useForm, useFormModified, useModal } from '@payloadcms/ui';
import React from 'react';
import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js';
import { AssignTenantFieldModal, assignTenantModalSlug } from '../AssignTenantFieldModal/index.client.js';
import './index.scss';
const baseClass = 'tenantField';
export const TenantField = ({ debug, unique, ...fieldArgs })=>{
    const { entityType, options, selectedTenantID, setEntityType, setTenant } = useTenantSelection();
    const { setValue, showError, value } = useField();
    const modified = useFormModified();
    const { isValid: isFormValid, setModified } = useForm();
    const { id: docID, collectionSlug } = useDocumentInfo();
    const { isModalOpen, openModal } = useModal();
    const isEditManyModalOpen = collectionSlug ? isModalOpen(`edit-${collectionSlug}`) : false;
    const isConfirmingRef = React.useRef(false);
    const prevModified = React.useRef(modified);
    const prevValue = React.useRef(value);
    const showField = options.length > 1 && !fieldArgs.field.admin?.hidden && !fieldArgs.field.hidden || debug;
    const onConfirm = React.useCallback(()=>{
        isConfirmingRef.current = true;
    }, []);
    const afterModalOpen = React.useCallback(()=>{
        prevModified.current = modified;
        prevValue.current = value;
    }, [
        modified,
        value
    ]);
    const afterModalClose = React.useCallback(()=>{
        let didChange = true;
        if (isConfirmingRef.current) {
            // did the values actually change?
            if (fieldArgs.field.hasMany) {
                const prev = prevValue.current || [];
                const newValue = value || [];
                if (prev.length !== newValue.length) {
                    didChange = true;
                } else {
                    const allMatch = newValue.every((val)=>prev.includes(val));
                    if (allMatch) {
                        didChange = false;
                    }
                }
            } else if (value === prevValue.current) {
                didChange = false;
            }
            if (didChange) {
                prevModified.current = true;
                prevValue.current = value;
            }
        }
        setValue(prevValue.current, true);
        setModified(prevModified.current);
        isConfirmingRef.current = false;
    }, [
        setValue,
        setModified,
        value,
        fieldArgs.field.hasMany
    ]);
    React.useEffect(()=>{
        if (!entityType) {
            setEntityType(unique ? 'global' : 'document');
        } else {
            // unique documents are controlled from the global TenantSelector
            if (!unique && value) {
                if (Array.isArray(value)) {
                    if (value.length) {
                        if (!selectedTenantID) {
                            setTenant({
                                id: value[0],
                                refresh: false
                            });
                        } else if (!value.includes(selectedTenantID)) {
                            setTenant({
                                id: value[0],
                                refresh: false
                            });
                        }
                    }
                } else if (selectedTenantID !== value) {
                    setTenant({
                        id: value,
                        refresh: false
                    });
                }
            }
        }
        return ()=>{
            if (entityType) {
                setEntityType(undefined);
            }
        };
    }, [
        unique,
        options,
        selectedTenantID,
        setTenant,
        value,
        setEntityType,
        entityType
    ]);
    React.useEffect(()=>{
        if (unique) {
            return;
        }
        if (!isFormValid && showError && showField || !value && !selectedTenantID) {
            openModal(assignTenantModalSlug);
        }
    }, [
        isFormValid,
        showError,
        showField,
        openModal,
        value,
        docID,
        selectedTenantID,
        unique
    ]);
    if (showField) {
        if (debug || isEditManyModalOpen) {
            return /*#__PURE__*/ _jsx(TenantRelationshipField, {
                debug: debug,
                fieldArgs: fieldArgs,
                unique: unique
            });
        }
        if (!unique) {
            /** Editing a non-global tenant document */ return /*#__PURE__*/ _jsx(AssignTenantFieldModal, {
                afterModalClose: afterModalClose,
                afterModalOpen: afterModalOpen,
                onConfirm: onConfirm,
                children: /*#__PURE__*/ _jsx(TenantRelationshipField, {
                    fieldArgs: fieldArgs,
                    unique: unique
                })
            });
        }
        return /*#__PURE__*/ _jsx(SyncFormModified, {});
    }
    return null;
};
const TenantRelationshipField = ({ debug, fieldArgs, unique })=>{
    return /*#__PURE__*/ _jsx("div", {
        className: baseClass,
        children: /*#__PURE__*/ _jsxs("div", {
            className: `${baseClass}__wrapper`,
            children: [
                debug && /*#__PURE__*/ _jsx(Pill, {
                    className: `${baseClass}__debug-pill`,
                    pillStyle: "success",
                    size: "small",
                    children: "Multi-Tenant Debug Enabled"
                }),
                /*#__PURE__*/ _jsx(RelationshipField, {
                    ...fieldArgs,
                    field: {
                        ...fieldArgs.field,
                        required: true
                    },
                    readOnly: fieldArgs.readOnly || fieldArgs.field.admin?.readOnly || unique
                })
            ]
        })
    });
};
/**
 * Tells the global selector when the form has been modified
 * so it can display the "Leave without saving" confirmation modal
 * if modified and attempting to change the tenant
 */ const SyncFormModified = ()=>{
    const modified = useFormModified();
    const { setModified } = useTenantSelection();
    React.useEffect(()=>{
        setModified(modified);
    }, [
        modified,
        setModified
    ]);
    return null;
};

//# sourceMappingURL=index.client.js.map