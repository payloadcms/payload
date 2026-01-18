import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fieldAffectsData, fieldHasSubFields } from 'payload/shared';
import React, { Fragment } from 'react';
const createNestedClientFieldPath = (parentPath, field)=>{
    if (parentPath) {
        if (fieldAffectsData(field)) {
            return `${parentPath}.${field.name}`;
        }
        return parentPath;
    }
    if (fieldAffectsData(field)) {
        return field.name;
    }
    return '';
};
const combineLabel = ({ field, prefix })=>{
    return /*#__PURE__*/ _jsxs(Fragment, {
        children: [
            prefix ? /*#__PURE__*/ _jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        style: {
                            display: 'inline-block'
                        },
                        children: prefix
                    }),
                    ' > '
                ]
            }) : null,
            /*#__PURE__*/ _jsx("span", {
                style: {
                    display: 'inline-block'
                },
                children: 'label' in field && typeof field.label === 'string' ? field.label : ('name' in field && field.name) ?? 'unnamed field'
            })
        ]
    });
};
export const reduceFields = ({ disabledFields = [], fields, labelPrefix = null, path = '' })=>{
    if (!fields) {
        return [];
    }
    return fields.reduce((fieldsToUse, field)=>{
        // escape for a variety of reasons, include ui fields as they have `name`.
        if (field.type === 'ui') {
            return fieldsToUse;
        }
        if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
            return [
                ...fieldsToUse,
                ...reduceFields({
                    disabledFields,
                    fields: field.fields,
                    labelPrefix: combineLabel({
                        field,
                        prefix: labelPrefix
                    }),
                    path: createNestedClientFieldPath(path, field)
                })
            ];
        }
        if (field.type === 'tabs' && 'tabs' in field) {
            return [
                ...fieldsToUse,
                ...field.tabs.reduce((tabFields, tab)=>{
                    if ('fields' in tab) {
                        const isNamedTab = 'name' in tab && tab.name;
                        const newPath = isNamedTab ? `${path}${path ? '.' : ''}${tab.name}` : path;
                        return [
                            ...tabFields,
                            ...reduceFields({
                                disabledFields,
                                fields: tab.fields,
                                labelPrefix: isNamedTab ? combineLabel({
                                    field: {
                                        name: tab.name,
                                        label: tab.label ?? tab.name
                                    },
                                    prefix: labelPrefix
                                }) : labelPrefix,
                                path: newPath
                            })
                        ];
                    }
                    return tabFields;
                }, [])
            ];
        }
        const val = createNestedClientFieldPath(path, field);
        // If the field is disabled, skip it
        if (disabledFields.some((disabledField)=>val === disabledField || val.startsWith(`${disabledField}.`))) {
            return fieldsToUse;
        }
        const formattedField = {
            id: val,
            label: combineLabel({
                field,
                prefix: labelPrefix
            }),
            value: val
        };
        return [
            ...fieldsToUse,
            formattedField
        ];
    }, []);
};

//# sourceMappingURL=reduceFields.js.map