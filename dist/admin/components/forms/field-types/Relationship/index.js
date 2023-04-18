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
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../utilities/Config");
const Auth_1 = require("../../../utilities/Auth");
const withCondition_1 = __importDefault(require("../../withCondition"));
const ReactSelect_1 = __importDefault(require("../../../elements/ReactSelect"));
const useField_1 = __importDefault(require("../../useField"));
const Label_1 = __importDefault(require("../../Label"));
const Error_1 = __importDefault(require("../../Error"));
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const validations_1 = require("../../../../../fields/validations");
const context_1 = require("../../Form/context");
const optionsReducer_1 = __importDefault(require("./optionsReducer"));
const createRelationMap_1 = require("./createRelationMap");
const useDebouncedCallback_1 = require("../../../../hooks/useDebouncedCallback");
const wordBoundariesRegex_1 = __importDefault(require("../../../../../utilities/wordBoundariesRegex"));
const AddNew_1 = require("./AddNew");
const findOptionsByValue_1 = require("./findOptionsByValue");
const GetFilterOptions_1 = require("../../../utilities/GetFilterOptions");
const SingleValue_1 = require("./select-components/SingleValue");
const MultiValueLabel_1 = require("./select-components/MultiValueLabel");
const Locale_1 = require("../../../utilities/Locale");
require("./index.scss");
const maxResultsPerRequest = 10;
const baseClass = 'relationship';
const Relationship = (props) => {
    const { relationTo, validate = validations_1.relationship, path, name, required, label, hasMany, filterOptions, admin: { readOnly, style, className, width, description, condition, isSortable = true, allowCreate = true, } = {}, } = props;
    const config = (0, Config_1.useConfig)();
    const { serverURL, routes: { api, }, collections, } = config;
    const { t, i18n } = (0, react_i18next_1.useTranslation)('fields');
    const { permissions } = (0, Auth_1.useAuth)();
    const locale = (0, Locale_1.useLocale)();
    const formProcessing = (0, context_1.useFormProcessing)();
    const hasMultipleRelations = Array.isArray(relationTo);
    const [options, dispatchOptions] = (0, react_1.useReducer)(optionsReducer_1.default, []);
    const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = (0, react_1.useState)(-1);
    const [lastLoadedPage, setLastLoadedPage] = (0, react_1.useState)(1);
    const [errorLoading, setErrorLoading] = (0, react_1.useState)('');
    const [filterOptionsResult, setFilterOptionsResult] = (0, react_1.useState)();
    const [search, setSearch] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [hasLoadedFirstPage, setHasLoadedFirstPage] = (0, react_1.useState)(false);
    const [enableWordBoundarySearch, setEnableWordBoundarySearch] = (0, react_1.useState)(false);
    const firstRun = (0, react_1.useRef)(true);
    const pathOrName = path || name;
    const memoizedValidate = (0, react_1.useCallback)((value, validationOptions) => {
        return validate(value, { ...validationOptions, required });
    }, [validate, required]);
    const { value, showError, errorMessage, setValue, initialValue, } = (0, useField_1.default)({
        path: pathOrName,
        validate: memoizedValidate,
        condition,
    });
    const [drawerIsOpen, setDrawerIsOpen] = (0, react_1.useState)(false);
    const getResults = (0, react_1.useCallback)(async ({ lastFullyLoadedRelation: lastFullyLoadedRelationArg, lastLoadedPage: lastLoadedPageArg, search: searchArg, value: valueArg, sort, onSuccess, }) => {
        if (!permissions) {
            return;
        }
        let lastLoadedPageToUse = typeof lastLoadedPageArg !== 'undefined' ? lastLoadedPageArg : 1;
        const lastFullyLoadedRelationToUse = typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1;
        const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
        const relationsToFetch = lastFullyLoadedRelationToUse === -1 ? relations : relations.slice(lastFullyLoadedRelationToUse + 1);
        let resultsFetched = 0;
        const relationMap = (0, createRelationMap_1.createRelationMap)({
            hasMany,
            relationTo,
            value: valueArg,
        });
        if (!errorLoading) {
            relationsToFetch.reduce(async (priorRelation, relation) => {
                var _a;
                await priorRelation;
                if (resultsFetched < 10) {
                    const collection = collections.find((coll) => coll.slug === relation);
                    const fieldToSearch = ((_a = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _a === void 0 ? void 0 : _a.useAsTitle) || 'id';
                    const query = {
                        where: {
                            and: [
                                {
                                    id: {
                                        not_in: relationMap[relation],
                                    },
                                },
                            ],
                        },
                        limit: maxResultsPerRequest,
                        page: lastLoadedPageToUse,
                        sort: fieldToSearch,
                        locale,
                        depth: 0,
                    };
                    if (searchArg) {
                        query.where.and.push({
                            [fieldToSearch]: {
                                like: searchArg,
                            },
                        });
                    }
                    if (filterOptionsResult === null || filterOptionsResult === void 0 ? void 0 : filterOptionsResult[relation]) {
                        query.where.and.push(filterOptionsResult[relation]);
                    }
                    const response = await fetch(`${serverURL}${api}/${relation}?${qs_1.default.stringify(query)}`, {
                        credentials: 'include',
                        headers: {
                            'Accept-Language': i18n.language,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.docs.length > 0) {
                            resultsFetched += data.docs.length;
                            dispatchOptions({
                                type: 'ADD',
                                docs: data.docs,
                                collection,
                                sort,
                                i18n,
                                config,
                            });
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
                    else if (response.status === 403) {
                        setLastFullyLoadedRelation(relations.indexOf(relation));
                        lastLoadedPageToUse = 1;
                        dispatchOptions({
                            type: 'ADD',
                            docs: [],
                            collection,
                            sort,
                            ids: relationMap[relation],
                            i18n,
                            config,
                        });
                    }
                    else {
                        setErrorLoading(t('error:unspecific'));
                    }
                }
            }, Promise.resolve());
            if (typeof onSuccess === 'function')
                onSuccess();
        }
    }, [
        permissions,
        relationTo,
        hasMany,
        errorLoading,
        collections,
        filterOptionsResult,
        serverURL,
        api,
        t,
        i18n,
        locale,
        config,
    ]);
    const updateSearch = (0, useDebouncedCallback_1.useDebouncedCallback)((searchArg, valueArg) => {
        getResults({ search: searchArg, value: valueArg, sort: true });
        setSearch(searchArg);
    }, [getResults]);
    const handleInputChange = (0, react_1.useCallback)((searchArg, valueArg) => {
        if (search !== searchArg) {
            updateSearch(searchArg, valueArg);
        }
    }, [search, updateSearch]);
    // ///////////////////////////////////
    // Ensure we have an option for each value
    // ///////////////////////////////////
    (0, react_1.useEffect)(() => {
        const relationMap = (0, createRelationMap_1.createRelationMap)({
            hasMany,
            relationTo,
            value,
        });
        Object.entries(relationMap).reduce(async (priorRelation, [relation, ids]) => {
            await priorRelation;
            const idsToLoad = ids.filter((id) => {
                return !options.find((optionGroup) => { var _a; return (_a = optionGroup === null || optionGroup === void 0 ? void 0 : optionGroup.options) === null || _a === void 0 ? void 0 : _a.find((option) => option.value === id && option.relationTo === relation); });
            });
            if (idsToLoad.length > 0) {
                const query = {
                    where: {
                        id: {
                            in: idsToLoad,
                        },
                    },
                    depth: 0,
                    locale,
                    limit: idsToLoad.length,
                };
                if (!errorLoading) {
                    const response = await fetch(`${serverURL}${api}/${relation}?${qs_1.default.stringify(query)}`, {
                        credentials: 'include',
                        headers: {
                            'Accept-Language': i18n.language,
                        },
                    });
                    const collection = collections.find((coll) => coll.slug === relation);
                    let docs = [];
                    if (response.ok) {
                        const data = await response.json();
                        docs = data.docs;
                    }
                    dispatchOptions({
                        type: 'ADD',
                        docs,
                        collection,
                        sort: true,
                        ids: idsToLoad,
                        i18n,
                        config,
                    });
                }
            }
        }, Promise.resolve());
    }, [
        options,
        value,
        hasMany,
        errorLoading,
        collections,
        hasMultipleRelations,
        serverURL,
        api,
        i18n,
        relationTo,
        locale,
        config,
    ]);
    // Determine if we should switch to word boundary search
    (0, react_1.useEffect)(() => {
        const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
        const isIdOnly = relations.reduce((idOnly, relation) => {
            var _a;
            const collection = collections.find((coll) => coll.slug === relation);
            const fieldToSearch = ((_a = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _a === void 0 ? void 0 : _a.useAsTitle) || 'id';
            return fieldToSearch === 'id' && idOnly;
        }, true);
        setEnableWordBoundarySearch(!isIdOnly);
    }, [relationTo, collections]);
    // When (`relationTo` || `filterOptionsResult` || `locale`) changes, reset component
    // Note - effect should not run on first run
    (0, react_1.useEffect)(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        dispatchOptions({ type: 'CLEAR' });
        setLastFullyLoadedRelation(-1);
        setLastLoadedPage(1);
        setHasLoadedFirstPage(false);
    }, [relationTo, filterOptionsResult, locale]);
    const onSave = (0, react_1.useCallback)((args) => {
        dispatchOptions({ type: 'UPDATE', doc: args.doc, collection: args.collectionConfig, i18n, config });
    }, [i18n, config]);
    const classes = [
        'field-type',
        baseClass,
        className,
        showError && 'error',
        errorLoading && 'error-loading',
        readOnly && `${baseClass}--read-only`,
    ].filter(Boolean).join(' ');
    const valueToRender = (0, findOptionsByValue_1.findOptionsByValue)({ value, options });
    if (!Array.isArray(valueToRender) && (valueToRender === null || valueToRender === void 0 ? void 0 : valueToRender.value) === 'null')
        valueToRender.value = null;
    return (react_1.default.createElement("div", { id: `field-${(pathOrName).replace(/\./gi, '__')}`, className: classes, style: {
            ...style,
            width,
        } },
        react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage }),
        react_1.default.createElement(Label_1.default, { htmlFor: pathOrName, label: label, required: required }),
        react_1.default.createElement(GetFilterOptions_1.GetFilterOptions, { ...{ filterOptionsResult, setFilterOptionsResult, filterOptions, path: pathOrName, relationTo } }),
        !errorLoading && (react_1.default.createElement("div", { className: `${baseClass}__wrap` },
            react_1.default.createElement(ReactSelect_1.default, { isDisabled: readOnly, onInputChange: (newSearch) => handleInputChange(newSearch, value), onChange: !readOnly ? (selected) => {
                    if (selected === null) {
                        setValue(hasMany ? [] : null);
                    }
                    else if (hasMany) {
                        setValue(selected ? selected.map((option) => {
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
                        setValue({
                            relationTo: selected.relationTo,
                            value: selected.value,
                        });
                    }
                    else {
                        setValue(selected.value);
                    }
                } : undefined, onMenuScrollToBottom: () => {
                    getResults({
                        lastFullyLoadedRelation,
                        lastLoadedPage: lastLoadedPage + 1,
                        search,
                        value: initialValue,
                        sort: false,
                    });
                }, value: valueToRender !== null && valueToRender !== void 0 ? valueToRender : null, showError: showError, disabled: formProcessing, options: options, isMulti: hasMany, isSortable: isSortable, isLoading: isLoading, components: {
                    SingleValue: SingleValue_1.SingleValue,
                    MultiValueLabel: MultiValueLabel_1.MultiValueLabel,
                }, selectProps: {
                    disableMouseDown: drawerIsOpen,
                    disableKeyDown: drawerIsOpen,
                    setDrawerIsOpen,
                    onSave,
                }, onMenuOpen: () => {
                    if (!hasLoadedFirstPage) {
                        setIsLoading(true);
                        getResults({
                            value: initialValue,
                            onSuccess: () => {
                                setHasLoadedFirstPage(true);
                                setIsLoading(false);
                            },
                        });
                    }
                }, filterOption: enableWordBoundarySearch ? (item, searchFilter) => {
                    const r = (0, wordBoundariesRegex_1.default)(searchFilter || '');
                    return r.test(item.label);
                } : undefined }),
            !readOnly && allowCreate && (react_1.default.createElement(AddNew_1.AddNewRelation, { ...{ path: pathOrName, hasMany, relationTo, value, setValue, dispatchOptions } })))),
        errorLoading && (react_1.default.createElement("div", { className: `${baseClass}__error-loading` }, errorLoading)),
        react_1.default.createElement(FieldDescription_1.default, { value: value, description: description })));
};
exports.default = (0, withCondition_1.default)(Relationship);
//# sourceMappingURL=index.js.map