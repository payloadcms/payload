'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldLabel, ReactSelect, useConfig, useDocumentInfo, useField, useListQuery } from '@payloadcms/ui';
import React, { useEffect } from 'react';
import { useImportExport } from '../ImportExportProvider/index.js';
import { reduceFields } from './reduceFields.js';
const baseClass = 'fields-to-export';
export const FieldsToExport = (props)=>{
    const { id } = useDocumentInfo();
    const { setValue, value } = useField();
    const { value: collectionSlug } = useField({
        path: 'collectionSlug'
    });
    const { getEntityConfig } = useConfig();
    const { collection } = useImportExport();
    const { query } = useListQuery();
    const collectionConfig = getEntityConfig({
        collectionSlug: collectionSlug ?? collection
    });
    const disabledFields = collectionConfig?.admin?.custom?.['plugin-import-export']?.disabledFields ?? [];
    const fieldOptions = reduceFields({
        disabledFields,
        fields: collectionConfig?.fields
    });
    useEffect(()=>{
        if (id || !collectionSlug) {
            return;
        }
        const queryColumns = query?.columns;
        if (Array.isArray(queryColumns)) {
            const cleanColumns = queryColumns.filter((col)=>typeof col === 'string' && !col.startsWith('-'));
            // If columns are specified in the query, use them
            setValue(cleanColumns);
        } else {
            // Fallback if no columns in query
            setValue(collectionConfig?.admin?.defaultColumns ?? []);
        }
    }, [
        id,
        collectionSlug,
        query?.columns,
        collectionConfig?.admin?.defaultColumns,
        setValue
    ]);
    const onChange = (options)=>{
        if (!options) {
            setValue([]);
            return;
        }
        const updatedValue = options.map((option)=>typeof option === 'object' ? option.value : option);
        setValue(updatedValue);
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: baseClass,
        children: [
            /*#__PURE__*/ _jsx(FieldLabel, {
                label: props.field.label,
                path: props.path
            }),
            /*#__PURE__*/ _jsx(ReactSelect, {
                className: baseClass,
                disabled: props.readOnly,
                getOptionValue: (option)=>String(option.value),
                inputId: `field-${props.path.replace(/\./g, '__')}`,
                isClearable: true,
                isMulti: true,
                isSortable: true,
                // @ts-expect-error react select option
                onChange: onChange,
                options: fieldOptions,
                value: Array.isArray(value) ? value.map((val)=>{
                    const match = fieldOptions.find((opt)=>opt.value === val);
                    return match ? {
                        ...match,
                        id: val
                    } : {
                        id: val,
                        label: val,
                        value: val
                    };
                }) : []
            })
        ]
    });
};

//# sourceMappingURL=index.js.map