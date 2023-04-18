"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUseAsTitle = void 0;
const react_i18next_1 = require("react-i18next");
const context_1 = require("../components/forms/Form/context");
const Config_1 = require("../components/utilities/Config");
const formatDate_1 = require("../utilities/formatDate");
const getObjectDotNotation_1 = require("../../utilities/getObjectDotNotation");
// either send the `useAsTitle` field itself
// or an object to dynamically extract the `useAsTitle` field from
const formatUseAsTitle = (args) => {
    var _a, _b, _c;
    const { field: fieldFromProps, doc, collection, collection: { admin: { useAsTitle }, }, i18n, config: { admin: { dateFormat: dateFormatFromConfig, }, }, } = args;
    if (!fieldFromProps && !doc) {
        return '';
    }
    const field = fieldFromProps || (0, getObjectDotNotation_1.getObjectDotNotation)(doc, collection.admin.useAsTitle);
    let title = typeof field === 'string' ? field : field === null || field === void 0 ? void 0 : field.value;
    const fieldConfig = (_a = collection === null || collection === void 0 ? void 0 : collection.fields) === null || _a === void 0 ? void 0 : _a.find((f) => 'name' in f && (f === null || f === void 0 ? void 0 : f.name) === useAsTitle);
    const isDate = (fieldConfig === null || fieldConfig === void 0 ? void 0 : fieldConfig.type) === 'date';
    if (title && isDate) {
        const dateFormat = ((_c = (_b = fieldConfig === null || fieldConfig === void 0 ? void 0 : fieldConfig.admin) === null || _b === void 0 ? void 0 : _b.date) === null || _c === void 0 ? void 0 : _c.displayFormat) || dateFormatFromConfig;
        title = (0, formatDate_1.formatDate)(title, dateFormat, i18n === null || i18n === void 0 ? void 0 : i18n.language);
    }
    return title;
};
exports.formatUseAsTitle = formatUseAsTitle;
const useTitle = (collection) => {
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const field = (0, context_1.useFormFields)(([formFields]) => { var _a; return formFields[(_a = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _a === void 0 ? void 0 : _a.useAsTitle]; });
    const config = (0, Config_1.useConfig)();
    return (0, exports.formatUseAsTitle)({ field, collection, i18n, config });
};
exports.default = useTitle;
//# sourceMappingURL=useTitle.js.map