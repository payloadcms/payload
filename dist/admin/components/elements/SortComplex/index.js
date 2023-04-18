"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const qs_1 = __importDefault(require("qs"));
const react_router_dom_1 = require("react-router-dom");
const react_i18next_1 = require("react-i18next");
const ReactSelect_1 = __importDefault(require("../ReactSelect"));
const sortableFieldTypes_1 = __importDefault(require("../../../../fields/sortableFieldTypes"));
const SearchParams_1 = require("../../utilities/SearchParams");
const types_1 = require("../../../../fields/config/types");
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'sort-complex';
const SortComplex = (props) => {
    const { collection, modifySearchQuery = true, handleChange, } = props;
    const history = (0, react_router_dom_1.useHistory)();
    const params = (0, SearchParams_1.useSearchParams)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const [sortOptions, setSortOptions] = (0, react_1.useState)();
    const [sortFields] = (0, react_1.useState)(() => collection.fields.reduce((fields, field) => {
        if ((0, types_1.fieldAffectsData)(field) && sortableFieldTypes_1.default.indexOf(field.type) > -1) {
            return [
                ...fields,
                { label: (0, getTranslation_1.getTranslation)(field.label || field.name, i18n), value: field.name },
            ];
        }
        return fields;
    }, []));
    const [sortField, setSortField] = (0, react_1.useState)(sortFields[0]);
    const [initialSort] = (0, react_1.useState)(() => ({ label: t('descending'), value: '-' }));
    const [sortOrder, setSortOrder] = (0, react_1.useState)(initialSort);
    (0, react_1.useEffect)(() => {
        if (sortField === null || sortField === void 0 ? void 0 : sortField.value) {
            const newSortValue = `${sortOrder.value}${sortField.value}`;
            if (handleChange)
                handleChange(newSortValue);
            if (params.sort !== newSortValue && modifySearchQuery) {
                history.replace({
                    search: qs_1.default.stringify({
                        ...params,
                        sort: newSortValue,
                    }, { addQueryPrefix: true }),
                });
            }
        }
    }, [history, params, sortField, sortOrder, modifySearchQuery, handleChange]);
    (0, react_1.useEffect)(() => {
        setSortOptions([{ label: t('ascending'), value: '' }, { label: t('descending'), value: '-' }]);
    }, [i18n, t]);
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: `${baseClass}__wrap` },
                react_1.default.createElement("div", { className: `${baseClass}__select` },
                    react_1.default.createElement("div", { className: `${baseClass}__label` }, t('columnToSort')),
                    react_1.default.createElement(ReactSelect_1.default, { value: sortField, options: sortFields, onChange: setSortField })),
                react_1.default.createElement("div", { className: `${baseClass}__select` },
                    react_1.default.createElement("div", { className: `${baseClass}__label` }, t('order')),
                    react_1.default.createElement(ReactSelect_1.default, { value: sortOrder, options: sortOptions, onChange: (incomingSort) => {
                            setSortOrder(incomingSort || initialSort);
                        } }))))));
};
exports.default = SortComplex;
//# sourceMappingURL=index.js.map