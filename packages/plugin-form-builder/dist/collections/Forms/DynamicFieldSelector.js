'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { SelectField, useForm } from '@payloadcms/ui';
import React, { useEffect, useState } from 'react';
export const DynamicFieldSelector = (props)=>{
    const { fields, getDataByPath } = useForm();
    const [options, setOptions] = useState([]);
    useEffect(()=>{
        const fields = getDataByPath('fields');
        if (fields) {
            const allNonPaymentFields = fields.map((block)=>{
                const { name, blockType, label } = block;
                if (blockType !== 'payment') {
                    return {
                        label,
                        value: name
                    };
                }
                return null;
            }).filter((field)=>field !== null);
            setOptions(allNonPaymentFields);
        }
    }, [
        fields,
        getDataByPath
    ]);
    return /*#__PURE__*/ _jsx(SelectField, {
        ...props,
        field: {
            ...props.field || {},
            options
        }
    });
};

//# sourceMappingURL=DynamicFieldSelector.js.map