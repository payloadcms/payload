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
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../../utilities/Config");
const optionsReducer_1 = __importDefault(require("./optionsReducer"));
const useDebounce_1 = __importDefault(require("../../../../../hooks/useDebounce"));
const ReactSelect_1 = __importDefault(require("../../../ReactSelect"));
require("./index.scss");
const baseClass = 'condition-value-relationship';
const maxResultsPerRequest = 10;
const RelationshipField = (props) => {
    const { onChange, value, relationTo, hasMany, admin: { isSortable } = {} } = props;
    const { serverURL, routes: { api, }, collections, } = (0, Config_1.useConfig)();
    const hasMultipleRelations = Array.isArray(relationTo);
    const [options, dispatchOptions] = (0, react_1.useReducer)(optionsReducer_1.default, []);
    const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = (0, react_1.useState)(-1);
    const [lastLoadedPage, setLastLoadedPage] = (0, react_1.useState)(1);
    const [search, setSearch] = (0, react_1.useState)('');
    const [errorLoading, setErrorLoading] = (0, react_1.useState)('');
    const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = (0, react_1.useState)(false);
    const debouncedSearch = (0, useDebounce_1.default)(search, 300);
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const addOptions = (0, react_1.useCallback)((data, relation) => {
        const collection = collections.find((coll) => coll.slug === relation);
        dispatchOptions({ type: 'ADD', data, relation, hasMultipleRelations, collection, i18n });
    }, [collections, hasMultipleRelations, i18n]);
    const getResults = (0, react_1.useCallback)(async ({ lastFullyLoadedRelation: lastFullyLoadedRelationArg, lastLoadedPage: lastLoadedPageArg, search: searchArg, }) => {
        let lastLoadedPageToUse = typeof lastLoadedPageArg !== 'undefined' ? lastLoadedPageArg : 1;
        const lastFullyLoadedRelationToUse = typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1;
        const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
        const relationsToFetch = lastFullyLoadedRelationToUse === -1 ? relations : relations.slice(lastFullyLoadedRelationToUse + 1);
        let resultsFetched = 0;
        if (!errorLoading) {
            relationsToFetch.reduce(async (priorRelation, relation) => {
                var _a;
                await priorRelation;
                if (resultsFetched < 10) {
                    const collection = collections.find((coll) => coll.slug === relation);
                    const fieldToSearch = ((_a = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _a === void 0 ? void 0 : _a.useAsTitle) || 'id';
                    const searchParam = searchArg ? `&where[${fieldToSearch}][like]=${searchArg}` : '';
                    const response = await fetch(`${serverURL}${api}/${relation}?limit=${maxResultsPerRequest}&page=${lastLoadedPageToUse}&depth=0${searchParam}`, {
                        credentials: 'include',
                        headers: {
                            'Accept-Language': i18n.language,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.docs.length > 0) {
                            resultsFetched += data.docs.length;
                            addOptions(data, relation);
                            setLastLoadedPage(data.page);
                            if (!data.nextPage) {
                                setLastFullyLoadedRelation(relations.indexOf(relation));
                                // If there are more relations to search, need to reset lastLoadedPage to 1
                                // both locally within function and state
                                if (relations.indexOf(relation) + 1 < relations.length) {
                                    lastLoadedPageToUse = 1;
                                }
                            }
                        }
                    }
                    else {
                        setErrorLoading(t('errors:unspecific'));
                    }
                }
            }, Promise.resolve());
        }
    }, [i18n, relationTo, errorLoading, collections, serverURL, api, addOptions, t]);
    const findOptionsByValue = (0, react_1.useCallback)(() => {
        if (value) {
            if (hasMany) {
                if (Array.isArray(value)) {
                    return value.map((val) => {
                        if (hasMultipleRelations) {
                            let matchedOption;
                            options.forEach((opt) => {
                                if (opt.options) {
                                    opt.options.some((subOpt) => {
                                        if ((subOpt === null || subOpt === void 0 ? void 0 : subOpt.value) === val.value) {
                                            matchedOption = subOpt;
                                            return true;
                                        }
                                        return false;
                                    });
                                }
                            });
                            return matchedOption;
                        }
                        return options.find((opt) => opt.value === val);
                    });
                }
                return undefined;
            }
            if (hasMultipleRelations) {
                let matchedOption;
                const valueWithRelation = value;
                options.forEach((opt) => {
                    if (opt === null || opt === void 0 ? void 0 : opt.options) {
                        opt.options.some((subOpt) => {
                            if ((subOpt === null || subOpt === void 0 ? void 0 : subOpt.value) === valueWithRelation.value) {
                                matchedOption = subOpt;
                                return true;
                            }
                            return false;
                        });
                    }
                });
                return matchedOption;
            }
            return options.find((opt) => opt.value === value);
        }
        return undefined;
    }, [hasMany, hasMultipleRelations, value, options]);
    const handleInputChange = (0, react_1.useCallback)((newSearch) => {
        if (search !== newSearch) {
            setSearch(newSearch);
        }
    }, [search]);
    const addOptionByID = (0, react_1.useCallback)(async (id, relation) => {
        if (!errorLoading && id !== 'null') {
            const response = await fetch(`${serverURL}${api}/${relation}/${id}?depth=0`, {
                credentials: 'include',
                headers: {
                    'Accept-Language': i18n.language,
                },
            });
            if (response.ok) {
                const data = await response.json();
                addOptions({ docs: [data] }, relation);
            }
            else {
                console.error(t('error:loadingDocument', { id }));
            }
        }
    }, [i18n, addOptions, api, errorLoading, serverURL, t]);
    // ///////////////////////////
    // Get results when search input changes
    // ///////////////////////////
    (0, react_1.useEffect)(() => {
        dispatchOptions({
            type: 'CLEAR',
            required: true,
            i18n,
        });
        setHasLoadedFirstOptions(true);
        setLastLoadedPage(1);
        setLastFullyLoadedRelation(-1);
        getResults({ search: debouncedSearch });
    }, [getResults, debouncedSearch, relationTo, i18n]);
    // ///////////////////////////
    // Format options once first options have been retrieved
    // ///////////////////////////
    (0, react_1.useEffect)(() => {
        if (value && hasLoadedFirstOptions) {
            if (hasMany) {
                const matchedOptions = findOptionsByValue();
                (matchedOptions || []).forEach((option, i) => {
                    if (!option) {
                        if (hasMultipleRelations) {
                            addOptionByID(value[i].value, value[i].relationTo);
                        }
                        else {
                            addOptionByID(value[i], relationTo);
                        }
                    }
                });
            }
            else {
                const matchedOption = findOptionsByValue();
                if (!matchedOption) {
                    if (hasMultipleRelations) {
                        const valueWithRelation = value;
                        addOptionByID(valueWithRelation.value, valueWithRelation.relationTo);
                    }
                    else {
                        addOptionByID(value, relationTo);
                    }
                }
            }
        }
    }, [addOptionByID, findOptionsByValue, hasMany, hasMultipleRelations, relationTo, value, hasLoadedFirstOptions]);
    const classes = [
        'field-type',
        baseClass,
        errorLoading && 'error-loading',
    ].filter(Boolean).join(' ');
    const valueToRender = (findOptionsByValue() || value);
    return (react_1.default.createElement("div", { className: classes },
        !errorLoading && (react_1.default.createElement(ReactSelect_1.default, { placeholder: t('selectValue'), onInputChange: handleInputChange, onChange: (selected) => {
                if (hasMany) {
                    onChange(selected ? selected.map((option) => {
                        if (hasMultipleRelations) {
                            return {
                                relationTo: option.relationTo,
                                value: option.value,
                            };
                        }
                        return option.value;
                    }) : null);
                }
                else if (hasMultipleRelations) {
                    onChange({
                        relationTo: selected.relationTo,
                        value: selected.value,
                    });
                }
                else {
                    onChange(selected.value);
                }
            }, onMenuScrollToBottom: () => {
                getResults({ lastFullyLoadedRelation, lastLoadedPage: lastLoadedPage + 1 });
            }, value: valueToRender, options: options, isMulti: hasMany, isSortable: isSortable })),
        errorLoading && (react_1.default.createElement("div", { className: `${baseClass}__error-loading` }, errorLoading))));
};
exports.default = RelationshipField;
//# sourceMappingURL=index.js.map