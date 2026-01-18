'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from '@payloadcms/ui';
import { convertFromBaseValue } from '../utilities.js';
export const PriceCell = (args)=>{
    const { t } = useTranslation();
    const { cellData, currenciesConfig, currency: currencyFromProps, rowData } = args;
    const currency = currencyFromProps || currenciesConfig.supportedCurrencies[0];
    if (!currency) {
        // @ts-expect-error - plugin translations are not typed yet
        return /*#__PURE__*/ _jsx("span", {
            children: t('plugin-ecommerce:currencyNotSet')
        });
    }
    if ((!cellData || typeof cellData !== 'number') && 'enableVariants' in rowData && rowData.enableVariants) {
        // @ts-expect-error - plugin translations are not typed yet
        return /*#__PURE__*/ _jsx("span", {
            children: t('plugin-ecommerce:priceSetInVariants')
        });
    }
    if (!cellData) {
        // @ts-expect-error - plugin translations are not typed yet
        return /*#__PURE__*/ _jsx("span", {
            children: t('plugin-ecommerce:priceNotSet')
        });
    }
    return /*#__PURE__*/ _jsxs("span", {
        children: [
            currency.symbol,
            convertFromBaseValue({
                baseValue: cellData,
                currency
            })
        ]
    });
};

//# sourceMappingURL=index.js.map