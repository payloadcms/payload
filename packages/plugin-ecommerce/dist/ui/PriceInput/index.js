import { jsx as _jsx } from "react/jsx-runtime";
import './index.css';
import { FormattedInput } from './FormattedInput.js';
export const PriceInput = (args)=>{
    const { clientField: { label }, currenciesConfig, currency: currencyFromProps, field, i18n: { t }, i18n, path, readOnly } = args;
    const description = field.admin?.description ? typeof field.admin.description === 'function' ? field.admin.description({
        i18n,
        t
    }) : field.admin.description : undefined;
    return /*#__PURE__*/ _jsx(FormattedInput, {
        currency: currencyFromProps,
        description: description,
        label: label,
        path: path,
        readOnly: readOnly,
        supportedCurrencies: currenciesConfig?.supportedCurrencies
    });
};

//# sourceMappingURL=index.js.map