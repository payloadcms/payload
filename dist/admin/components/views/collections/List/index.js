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
const uuid_1 = require("uuid");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const qs_1 = __importDefault(require("qs"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../utilities/Config");
const Auth_1 = require("../../../utilities/Auth");
const usePayloadAPI_1 = __importDefault(require("../../../../hooks/usePayloadAPI"));
const Default_1 = __importDefault(require("./Default"));
const RenderCustomComponent_1 = __importDefault(require("../../../utilities/RenderCustomComponent"));
const StepNav_1 = require("../../../elements/StepNav");
const formatFields_1 = __importDefault(require("./formatFields"));
const Preferences_1 = require("../../../utilities/Preferences");
const SearchParams_1 = require("../../../utilities/SearchParams");
const TableColumns_1 = require("../../../elements/TableColumns");
const ListView = (props) => {
    var _a, _b;
    const { collection, collection: { slug, labels: { plural, }, admin: { pagination: { defaultLimit, }, components: { views: { List: CustomList, } = {}, } = {}, }, }, } = props;
    const { serverURL, routes: { api, admin } } = (0, Config_1.useConfig)();
    const preferenceKey = `${collection.slug}-list`;
    const { permissions } = (0, Auth_1.useAuth)();
    const { setStepNav } = (0, StepNav_1.useStepNav)();
    const { getPreference, setPreference } = (0, Preferences_1.usePreferences)();
    const { page, sort, limit, where } = (0, SearchParams_1.useSearchParams)();
    const history = (0, react_router_dom_1.useHistory)();
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const [fetchURL, setFetchURL] = (0, react_1.useState)('');
    const [fields] = (0, react_1.useState)(() => (0, formatFields_1.default)(collection, t));
    const collectionPermissions = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[slug];
    const hasCreatePermission = (_b = collectionPermissions === null || collectionPermissions === void 0 ? void 0 : collectionPermissions.create) === null || _b === void 0 ? void 0 : _b.permission;
    const newDocumentURL = `${admin}/collections/${slug}/create`;
    const [{ data }, { setParams }] = (0, usePayloadAPI_1.default)(fetchURL, { initialParams: { page: 1 } });
    (0, react_1.useEffect)(() => {
        setStepNav([
            {
                label: plural,
            },
        ]);
    }, [setStepNav, plural]);
    // /////////////////////////////////////
    // Set up Payload REST API query params
    // /////////////////////////////////////
    const resetParams = (0, react_1.useCallback)((overrides = {}) => {
        const params = {
            depth: 0,
            draft: 'true',
            page: overrides === null || overrides === void 0 ? void 0 : overrides.page,
            sort: overrides === null || overrides === void 0 ? void 0 : overrides.sort,
            where: overrides === null || overrides === void 0 ? void 0 : overrides.where,
            limit,
        };
        if (page)
            params.page = page;
        if (sort)
            params.sort = sort;
        if (where)
            params.where = where;
        params.invoke = (0, uuid_1.v4)();
        setParams(params);
    }, [limit, page, setParams, sort, where]);
    (0, react_1.useEffect)(() => {
        // Performance enhancement
        // Setting the Fetch URL this way
        // prevents a double-fetch
        setFetchURL(`${serverURL}${api}/${slug}`);
        resetParams();
    }, [api, resetParams, serverURL, slug]);
    // /////////////////////////////////////
    // Fetch preferences on first load
    // /////////////////////////////////////
    (0, react_1.useEffect)(() => {
        (async () => {
            const currentPreferences = await getPreference(preferenceKey);
            const params = qs_1.default.parse(history.location.search, { ignoreQueryPrefix: true, depth: 0 });
            const search = {
                ...params,
                sort: (params === null || params === void 0 ? void 0 : params.sort) || (currentPreferences === null || currentPreferences === void 0 ? void 0 : currentPreferences.sort),
                limit: (params === null || params === void 0 ? void 0 : params.limit) || (currentPreferences === null || currentPreferences === void 0 ? void 0 : currentPreferences.limit) || defaultLimit,
            };
            const newSearchQuery = qs_1.default.stringify(search, { addQueryPrefix: true });
            if (newSearchQuery.length > 1) {
                history.replace({
                    search: newSearchQuery,
                });
            }
        })();
    }, [collection, getPreference, preferenceKey, history, t, defaultLimit]);
    // /////////////////////////////////////
    // Set preferences on change
    // /////////////////////////////////////
    (0, react_1.useEffect)(() => {
        (async () => {
            const currentPreferences = await getPreference(preferenceKey);
            const newPreferences = {
                ...currentPreferences,
                limit,
                sort,
            };
            setPreference(preferenceKey, newPreferences);
        })();
    }, [sort, limit, preferenceKey, setPreference, getPreference]);
    // /////////////////////////////////////
    // Prevent going beyond page limit
    // /////////////////////////////////////
    (0, react_1.useEffect)(() => {
        if ((data === null || data === void 0 ? void 0 : data.totalDocs) && data.pagingCounter > data.totalDocs) {
            const params = qs_1.default.parse(history.location.search, {
                ignoreQueryPrefix: true,
                depth: 0,
            });
            const newSearchQuery = qs_1.default.stringify({
                ...params,
                page: data.totalPages,
            }, { addQueryPrefix: true });
            history.replace({
                search: newSearchQuery,
            });
        }
    }, [data, history, resetParams]);
    return (react_1.default.createElement(TableColumns_1.TableColumnsProvider, { collection: collection },
        react_1.default.createElement(RenderCustomComponent_1.default, { DefaultComponent: Default_1.default, CustomComponent: CustomList, componentProps: {
                collection: { ...collection, fields },
                newDocumentURL,
                hasCreatePermission,
                data,
                limit: limit || defaultLimit,
                resetParams,
            } })));
};
exports.default = ListView;
//# sourceMappingURL=index.js.map