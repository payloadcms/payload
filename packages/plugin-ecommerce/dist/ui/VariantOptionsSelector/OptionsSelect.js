'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldLabel, ReactSelect, useField } from '@payloadcms/ui';
import { useCallback, useId, useMemo } from 'react';
export const OptionsSelect = (props)=>{
    const { field: { required }, label, options: optionsFromProps, path } = props;
    const { setValue, value } = useField({
        path
    });
    const id = useId();
    const selectedValue = useMemo(()=>{
        if (!value || !Array.isArray(value) || value.length === 0) {
            return undefined;
        }
        const foundOption = optionsFromProps.find((option)=>{
            return value.find((item)=>item === option.value);
        });
        return foundOption;
    }, [
        optionsFromProps,
        value
    ]);
    const handleChange = useCallback(// @ts-expect-error - TODO: Fix types
    (option)=>{
        if (selectedValue) {
            let selectedValueIndex = -1;
            const valuesWithoutSelected = [
                ...value
            ].filter((o, index)=>{
                if (o === selectedValue.value) {
                    selectedValueIndex = index;
                    return false;
                }
                return true;
            });
            const newValues = [
                ...valuesWithoutSelected
            ];
            newValues.splice(selectedValueIndex, 0, option.value);
            setValue(newValues);
        } else {
            const values = [
                ...value || [],
                option.value
            ];
            setValue(values);
        }
    }, [
        selectedValue,
        setValue,
        value
    ]);
    return /*#__PURE__*/ _jsxs("div", {
        className: "variantOptionsSelectorItem",
        children: [
            /*#__PURE__*/ _jsx(FieldLabel, {
                htmlFor: id,
                label: label,
                required: required
            }),
            /*#__PURE__*/ _jsx(ReactSelect, {
                inputId: id,
                onChange: handleChange,
                options: optionsFromProps,
                value: selectedValue
            })
        ]
    });
};

//# sourceMappingURL=OptionsSelect.js.map