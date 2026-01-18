'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { NumberField, useField } from '@payloadcms/ui';
import React, { useEffect } from 'react';
import './index.scss';
const baseClass = 'page-field';
export const Page = (props)=>{
    const { setValue } = useField();
    const { value: limitValue } = useField({
        path: 'limit'
    });
    // Effect to reset page to 1 if limit is removed
    useEffect(()=>{
        if (!limitValue) {
            setValue(1); // Reset page to 1
        }
    }, [
        limitValue,
        setValue
    ]);
    return /*#__PURE__*/ _jsx("div", {
        className: baseClass,
        children: /*#__PURE__*/ _jsx(NumberField, {
            field: {
                name: props.field.name,
                admin: {
                    autoComplete: undefined,
                    placeholder: undefined,
                    step: 1
                },
                label: props.field.label,
                min: 1
            },
            onChange: (value)=>setValue(value ?? 1),
            path: props.path
        })
    });
};

//# sourceMappingURL=index.js.map