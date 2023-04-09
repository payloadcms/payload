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
const useThrottledEffect_1 = __importDefault(require("../../../hooks/useThrottledEffect"));
const Button_1 = __importDefault(require("../Button"));
const reducer_1 = __importDefault(require("./reducer"));
const Condition_1 = __importDefault(require("./Condition"));
const field_types_1 = __importDefault(require("./field-types"));
const flattenTopLevelFields_1 = __importDefault(require("../../../../utilities/flattenTopLevelFields"));
const SearchParams_1 = require("../../utilities/SearchParams");
const validateWhereQuery_1 = __importDefault(require("./validateWhereQuery"));
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'where-builder';
const reduceFields = (fields, i18n) => (0, flattenTopLevelFields_1.default)(fields).reduce((reduced, field) => {
    if (typeof field_types_1.default[field.type] === 'object') {
        const formattedField = {
            label: (0, getTranslation_1.getTranslation)(field.label || field.name, i18n),
            value: field.name,
            ...field_types_1.default[field.type],
            operators: field_types_1.default[field.type].operators.map((operator) => ({
                ...operator,
                label: i18n.t(`operators:${operator.label}`),
            })),
            props: {
                ...field,
            },
        };
        return [
            ...reduced,
            formattedField,
        ];
    }
    return reduced;
}, []);
const WhereBuilder = (props) => {
    const { collection, modifySearchQuery = true, handleChange, collection: { labels: { plural, } = {}, } = {}, } = props;
    const history = (0, react_router_dom_1.useHistory)();
    const params = (0, SearchParams_1.useSearchParams)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const [conditions, dispatchConditions] = (0, react_1.useReducer)(reducer_1.default, params.where, (whereFromSearch) => {
        if (modifySearchQuery && (0, validateWhereQuery_1.default)(whereFromSearch)) {
            return whereFromSearch.or;
        }
        return [];
    });
    const [reducedFields] = (0, react_1.useState)(() => reduceFields(collection.fields, i18n));
    (0, useThrottledEffect_1.default)(() => {
        const currentParams = qs_1.default.parse(history.location.search, { ignoreQueryPrefix: true, depth: 10 });
        const paramsToKeep = typeof (currentParams === null || currentParams === void 0 ? void 0 : currentParams.where) === 'object' && 'or' in currentParams.where ? currentParams.where.or.reduce((keptParams, param) => {
            const newParam = { ...param };
            if (param.and) {
                delete newParam.and;
            }
            return [
                ...keptParams,
                newParam,
            ];
        }, []) : [];
        const newWhereQuery = {
            ...typeof (currentParams === null || currentParams === void 0 ? void 0 : currentParams.where) === 'object' ? currentParams.where : {},
            or: [
                ...conditions,
                ...paramsToKeep,
            ],
        };
        if (handleChange)
            handleChange(newWhereQuery);
        const hasExistingConditions = typeof (currentParams === null || currentParams === void 0 ? void 0 : currentParams.where) === 'object' && 'or' in currentParams.where;
        const hasNewWhereConditions = conditions.length > 0;
        if (modifySearchQuery && ((hasExistingConditions && !hasNewWhereConditions) || hasNewWhereConditions)) {
            history.replace({
                search: qs_1.default.stringify({
                    ...currentParams,
                    page: 1,
                    where: newWhereQuery,
                }, { addQueryPrefix: true }),
            });
        }
    }, 500, [conditions, modifySearchQuery, handleChange]);
    return (react_1.default.createElement("div", { className: baseClass },
        conditions.length > 0 && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: `${baseClass}__label` }, t('filterWhere', { label: (0, getTranslation_1.getTranslation)(plural, i18n) })),
            react_1.default.createElement("ul", { className: `${baseClass}__or-filters` }, conditions.map((or, orIndex) => (react_1.default.createElement("li", { key: orIndex },
                orIndex !== 0 && (react_1.default.createElement("div", { className: `${baseClass}__label` }, t('or'))),
                react_1.default.createElement("ul", { className: `${baseClass}__and-filters` }, Array.isArray(or === null || or === void 0 ? void 0 : or.and) && or.and.map((_, andIndex) => (react_1.default.createElement("li", { key: andIndex },
                    andIndex !== 0 && (react_1.default.createElement("div", { className: `${baseClass}__label` }, t('and'))),
                    react_1.default.createElement(Condition_1.default, { value: conditions[orIndex].and[andIndex], orIndex: orIndex, andIndex: andIndex, key: andIndex, fields: reducedFields, dispatch: dispatchConditions }))))))))),
            react_1.default.createElement(Button_1.default, { className: `${baseClass}__add-or`, icon: "plus", buttonStyle: "icon-label", iconPosition: "left", iconStyle: "with-border", onClick: () => {
                    if (reducedFields.length > 0)
                        dispatchConditions({ type: 'add', field: reducedFields[0].value });
                } }, t('or')))),
        conditions.length === 0 && (react_1.default.createElement("div", { className: `${baseClass}__no-filters` },
            react_1.default.createElement("div", { className: `${baseClass}__label` }, t('noFiltersSet')),
            react_1.default.createElement(Button_1.default, { className: `${baseClass}__add-first-filter`, icon: "plus", buttonStyle: "icon-label", iconPosition: "left", iconStyle: "with-border", onClick: () => {
                    if (reducedFields.length > 0)
                        dispatchConditions({ type: 'add', field: reducedFields[0].value });
                } }, t('addFilter'))))));
};
exports.default = WhereBuilder;
//# sourceMappingURL=index.js.map