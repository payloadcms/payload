'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TextField, useLocale, useWatchForm } from '@payloadcms/ui';
import React, { useEffect, useState } from 'react';
export const DynamicPriceSelector = (props)=>{
    const { field, path } = props;
    const { fields, getData, getDataByPath } = useWatchForm();
    const locale = useLocale();
    const [isNumberField, setIsNumberField] = useState();
    const [valueType, setValueType] = useState();
    // only number fields can use 'valueOfField`
    useEffect(()=>{
        if (path) {
            const parentPath = path.split('.').slice(0, -1).join('.');
            const paymentFieldData = getDataByPath(parentPath);
            if (paymentFieldData) {
                const { fieldToUse, valueType } = paymentFieldData;
                setValueType(valueType);
                const { fields: allFields } = getData();
                const field = allFields.find((field)=>field.name === fieldToUse);
                if (field) {
                    const { blockType } = field;
                    setIsNumberField(blockType === 'number');
                }
            }
        }
    }, [
        fields,
        getDataByPath,
        getData,
        path
    ]);
    // TODO: make this a number field, block by Payload
    if (valueType === 'static') {
        return /*#__PURE__*/ _jsx(TextField, {
            ...props
        });
    }
    const localeCode = typeof locale === 'object' && 'code' in locale ? locale.code : locale;
    const localLabels = typeof field.label === 'object' ? field.label : {
        [localeCode]: field.label
    };
    const labelValue = localLabels[localeCode] || localLabels['en'] || '';
    if (valueType === 'valueOfField' && !isNumberField) {
        return /*#__PURE__*/ _jsxs("div", {
            children: [
                /*#__PURE__*/ _jsx("div", {
                    children: String(labelValue)
                }),
                /*#__PURE__*/ _jsx("div", {
                    style: {
                        color: '#9A9A9A'
                    },
                    children: "The selected field must be a number field."
                })
            ]
        });
    }
    return null;
};

//# sourceMappingURL=DynamicPriceSelector.js.map