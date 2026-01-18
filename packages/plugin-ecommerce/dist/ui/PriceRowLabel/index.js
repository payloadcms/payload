'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRowLabel } from '@payloadcms/ui';
import { useMemo } from 'react';
import './index.css';
import { convertFromBaseValue } from '../utilities.js';
export const PriceRowLabel = (props)=>{
    const { currenciesConfig } = props;
    const { defaultCurrency, supportedCurrencies } = currenciesConfig;
    const { data } = useRowLabel();
    const currency = useMemo(()=>{
        if (data.currency) {
            return supportedCurrencies.find((c)=>c.code === data.currency) ?? supportedCurrencies[0];
        }
        const fallbackCurrency = supportedCurrencies.find((c)=>c.code === defaultCurrency);
        if (fallbackCurrency) {
            return fallbackCurrency;
        }
        return supportedCurrencies[0];
    }, [
        data.currency,
        supportedCurrencies,
        defaultCurrency
    ]);
    const amount = useMemo(()=>{
        if (data.amount) {
            return convertFromBaseValue({
                baseValue: data.amount,
                currency: currency
            });
        }
        return '0';
    }, [
        currency,
        data.amount
    ]);
    return /*#__PURE__*/ _jsxs("div", {
        className: "priceRowLabel",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "priceLabel",
                children: "Price:"
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "priceValue",
                children: [
                    /*#__PURE__*/ _jsxs("span", {
                        children: [
                            currency?.symbol,
                            amount
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("span", {
                        children: [
                            "(",
                            data.currency,
                            ")"
                        ]
                    })
                ]
            })
        ]
    });
};

//# sourceMappingURL=index.js.map