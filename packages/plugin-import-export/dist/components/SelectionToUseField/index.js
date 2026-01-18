'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { RadioGroupField, useDocumentInfo, useField, useListQuery, useSelection, useTranslation } from '@payloadcms/ui';
import React, { useEffect, useMemo } from 'react';
const isWhereEmpty = (where)=>{
    if (!where || typeof where !== 'object') {
        return true;
    }
    // Flatten one level of OR/AND wrappers
    if (Array.isArray(where.and)) {
        return where.and.length === 0;
    }
    if (Array.isArray(where.or)) {
        return where.or.length === 0;
    }
    return Object.keys(where).length === 0;
};
export const SelectionToUseField = ()=>{
    const { id } = useDocumentInfo();
    const { query } = useListQuery();
    const { selectAll, selected } = useSelection();
    const { t } = useTranslation();
    const { setValue: setSelectionToUseValue, value: selectionToUseValue } = useField({
        path: 'selectionToUse'
    });
    const { setValue: setWhere } = useField({
        path: 'where'
    });
    const hasMeaningfulFilters = query?.where && !isWhereEmpty(query.where);
    const availableOptions = useMemo(()=>{
        const options = [
            {
                // @ts-expect-error - this is not correctly typed in plugins right now
                label: t('plugin-import-export:selectionToUse-allDocuments'),
                value: 'all'
            }
        ];
        if (hasMeaningfulFilters) {
            options.unshift({
                // @ts-expect-error - this is not correctly typed in plugins right now
                label: t('plugin-import-export:selectionToUse-currentFilters'),
                value: 'currentFilters'
            });
        }
        if ([
            'allInPage',
            'some'
        ].includes(selectAll)) {
            options.unshift({
                // @ts-expect-error - this is not correctly typed in plugins right now
                label: t('plugin-import-export:selectionToUse-currentSelection'),
                value: 'currentSelection'
            });
        }
        return options;
    }, [
        hasMeaningfulFilters,
        selectAll,
        t
    ]);
    // Auto-set default
    useEffect(()=>{
        if (id) {
            return;
        }
        let defaultSelection = 'all';
        if ([
            'allInPage',
            'some'
        ].includes(selectAll)) {
            defaultSelection = 'currentSelection';
        } else if (query?.where) {
            defaultSelection = 'currentFilters';
        }
        setSelectionToUseValue(defaultSelection);
    }, [
        id,
        selectAll,
        query?.where,
        setSelectionToUseValue
    ]);
    // Sync where clause with selected option
    useEffect(()=>{
        if (id) {
            return;
        }
        if (selectionToUseValue === 'currentFilters' && query?.where) {
            setWhere(query.where);
        } else if (selectionToUseValue === 'currentSelection' && selected) {
            const ids = [
                ...selected.entries()
            ].filter(([_, isSelected])=>isSelected).map(([id])=>id);
            setWhere({
                id: {
                    in: ids
                }
            });
        } else if (selectionToUseValue === 'all') {
            setWhere({});
        }
    }, [
        id,
        selectionToUseValue,
        query?.where,
        selected,
        setWhere
    ]);
    // Hide component if no other options besides "all" are available
    if (availableOptions.length <= 1) {
        return null;
    }
    return /*#__PURE__*/ _jsx(RadioGroupField, {
        field: {
            name: 'selectionToUse',
            type: 'radio',
            admin: {},
            // @ts-expect-error - this is not correctly typed in plugins right now
            label: t('plugin-import-export:field-selectionToUse-label'),
            options: availableOptions
        },
        // @ts-expect-error - this is not correctly typed in plugins right now
        label: t('plugin-import-export:field-selectionToUse-label'),
        options: availableOptions,
        path: "selectionToUse"
    });
};

//# sourceMappingURL=index.js.map