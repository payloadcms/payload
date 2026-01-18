'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldDescription, FieldLabel, useField, useFormFields } from '@payloadcms/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { USD } from '../../currencies/index.js';
import { convertFromBaseValue, convertToBaseValue } from '../utilities.js';
const baseClass = 'formattedPrice';
export const FormattedInput = ({ id: idFromProps, currency: currencyFromProps, description, disabled = false, label, path, placeholder = '0.00', readOnly, supportedCurrencies })=>{
    const { setValue, value } = useField({
        path
    });
    const [displayValue, setDisplayValue] = useState('');
    const inputRef = useRef(null);
    const isFirstRender = useRef(true);
    const debounceTimer = useRef(null);
    const parentPath = path.split('.').slice(0, -1).join('.');
    const currencyPath = parentPath ? `${parentPath}.currency` : 'currency';
    const currencyFromSelectField = useFormFields(([fields, _])=>fields[currencyPath]);
    const currencyCode = currencyFromProps?.code ?? currencyFromSelectField?.value;
    const id = idFromProps || path;
    const currency = useMemo(()=>{
        if (currencyCode && supportedCurrencies) {
            const foundCurrency = supportedCurrencies.find((supportedCurrency)=>supportedCurrency.code === currencyCode);
            return foundCurrency ?? supportedCurrencies[0] ?? USD;
        }
        return supportedCurrencies[0] ?? USD;
    }, [
        currencyCode,
        supportedCurrencies
    ]);
    useEffect(()=>{
        if (isFirstRender.current) {
            isFirstRender.current = false;
            if (value === undefined || value === null) {
                setDisplayValue('');
            } else {
                setDisplayValue(convertFromBaseValue({
                    baseValue: value,
                    currency
                }));
            }
        }
    }, [
        currency,
        value,
        currencyFromProps
    ]);
    const updateValue = useCallback((inputValue)=>{
        if (inputValue === '') {
            setValue(null);
            return;
        }
        const baseValue = convertToBaseValue({
            currency,
            displayValue: inputValue
        });
        setValue(baseValue);
    }, [
        currency,
        setValue
    ]);
    const handleInputChange = useCallback((e)=>{
        const inputValue = e.target.value;
        if (!/^\d*(?:\.\d*)?$/.test(inputValue) && inputValue !== '') {
            return;
        }
        setDisplayValue(inputValue);
        // Clear any existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        // Only update the base value after a delay to avoid formatting while typing
        debounceTimer.current = setTimeout(()=>{
            updateValue(inputValue);
        }, 500);
    }, [
        updateValue,
        setDisplayValue
    ]);
    const handleInputBlur = useCallback(()=>{
        if (displayValue === '') {
            return;
        }
        // Clear any pending debounce
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
        const baseValue = convertToBaseValue({
            currency,
            displayValue
        });
        const formattedValue = convertFromBaseValue({
            baseValue,
            currency
        });
        if (value != baseValue) {
            setValue(baseValue);
        }
        setDisplayValue(formattedValue);
    }, [
        currency,
        displayValue,
        setValue,
        value
    ]);
    return /*#__PURE__*/ _jsxs("div", {
        className: `field-type number ${baseClass}`,
        children: [
            label && /*#__PURE__*/ _jsx(FieldLabel, {
                as: "label",
                htmlFor: id,
                label: label
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: `${baseClass}Container`,
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        className: `${baseClass}CurrencySymbol`,
                        children: /*#__PURE__*/ _jsx("span", {
                            children: currency.symbol
                        })
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        className: `${baseClass}Input`,
                        disabled: disabled || readOnly,
                        id: id,
                        onBlur: handleInputBlur,
                        onChange: handleInputChange,
                        placeholder: placeholder,
                        ref: inputRef,
                        type: "text",
                        value: displayValue
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(FieldDescription, {
                className: `${baseClass}Description`,
                description: description,
                path: path
            })
        ]
    });
};

//# sourceMappingURL=FormattedInput.js.map