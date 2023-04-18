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
const react_router_dom_1 = require("react-router-dom");
const qs_1 = __importDefault(require("qs"));
const react_i18next_1 = require("react-i18next");
const Search_1 = __importDefault(require("../../icons/Search"));
const useDebounce_1 = __importDefault(require("../../../hooks/useDebounce"));
const SearchParams_1 = require("../../utilities/SearchParams");
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'search-filter';
const SearchFilter = (props) => {
    const { fieldName = 'id', fieldLabel = 'ID', modifySearchQuery = true, listSearchableFields, handleChange, } = props;
    const params = (0, SearchParams_1.useSearchParams)();
    const history = (0, react_router_dom_1.useHistory)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const [search, setSearch] = (0, react_1.useState)('');
    const [previousSearch, setPreviousSearch] = (0, react_1.useState)('');
    const placeholder = (0, react_1.useRef)(t('searchBy', { label: (0, getTranslation_1.getTranslation)(fieldLabel, i18n) }));
    const debouncedSearch = (0, useDebounce_1.default)(search, 300);
    (0, react_1.useEffect)(() => {
        const newWhere = { ...typeof (params === null || params === void 0 ? void 0 : params.where) === 'object' ? params.where : {} };
        const fieldNamesToSearch = [fieldName, ...(listSearchableFields || []).map(({ name }) => name)];
        fieldNamesToSearch.forEach((fieldNameToSearch) => {
            const hasOrQuery = Array.isArray(newWhere.or);
            const existingFieldSearchIndex = hasOrQuery ? newWhere.or.findIndex((condition) => {
                var _a;
                return (_a = condition === null || condition === void 0 ? void 0 : condition[fieldNameToSearch]) === null || _a === void 0 ? void 0 : _a.like;
            }) : -1;
            if (debouncedSearch) {
                if (!hasOrQuery)
                    newWhere.or = [];
                if (existingFieldSearchIndex > -1) {
                    newWhere.or[existingFieldSearchIndex][fieldNameToSearch].like = debouncedSearch;
                }
                else {
                    newWhere.or.push({
                        [fieldNameToSearch]: {
                            like: debouncedSearch,
                        },
                    });
                }
            }
            else if (existingFieldSearchIndex > -1) {
                newWhere.or.splice(existingFieldSearchIndex, 1);
            }
        });
        if (debouncedSearch !== previousSearch) {
            if (handleChange)
                handleChange(newWhere);
            if (modifySearchQuery) {
                history.replace({
                    search: qs_1.default.stringify({
                        ...params,
                        page: 1,
                        where: newWhere,
                    }),
                });
            }
            setPreviousSearch(debouncedSearch);
        }
    }, [debouncedSearch, previousSearch, history, fieldName, params, handleChange, modifySearchQuery, listSearchableFields]);
    (0, react_1.useEffect)(() => {
        if ((listSearchableFields === null || listSearchableFields === void 0 ? void 0 : listSearchableFields.length) > 0) {
            placeholder.current = listSearchableFields.reduce((prev, curr, i) => {
                if (i === listSearchableFields.length - 1) {
                    return `${prev} ${t('or')} ${(0, getTranslation_1.getTranslation)(curr.label || curr.name, i18n)}`;
                }
                return `${prev}, ${(0, getTranslation_1.getTranslation)(curr.label || curr.name, i18n)}`;
            }, placeholder.current);
        }
    }, [t, listSearchableFields, i18n]);
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("input", { className: `${baseClass}__input`, placeholder: placeholder.current, type: "text", value: search || '', onChange: (e) => setSearch(e.target.value) }),
        react_1.default.createElement(Search_1.default, null)));
};
exports.default = SearchFilter;
//# sourceMappingURL=index.js.map