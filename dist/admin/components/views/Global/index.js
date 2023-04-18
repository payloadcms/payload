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
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const StepNav_1 = require("../../elements/StepNav");
const usePayloadAPI_1 = __importDefault(require("../../../hooks/usePayloadAPI"));
const Locale_1 = require("../../utilities/Locale");
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const Default_1 = __importDefault(require("./Default"));
const buildStateFromSchema_1 = __importDefault(require("../../forms/Form/buildStateFromSchema"));
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const Preferences_1 = require("../../utilities/Preferences");
const GlobalView = (props) => {
    var _a;
    const { state: locationState } = (0, react_router_dom_1.useLocation)();
    const locale = (0, Locale_1.useLocale)();
    const { setStepNav } = (0, StepNav_1.useStepNav)();
    const { user } = (0, Auth_1.useAuth)();
    const [initialState, setInitialState] = (0, react_1.useState)();
    const [updatedAt, setUpdatedAt] = (0, react_1.useState)();
    const { getVersions, preferencesKey, docPermissions, getDocPermissions } = (0, DocumentInfo_1.useDocumentInfo)();
    const { getPreference } = (0, Preferences_1.usePreferences)();
    const { t } = (0, react_i18next_1.useTranslation)();
    const { serverURL, routes: { api, }, } = (0, Config_1.useConfig)();
    const { global } = props;
    const { slug, label, fields, admin: { components: { views: { Edit: CustomEdit, } = {}, } = {}, } = {}, } = global;
    const onSave = (0, react_1.useCallback)(async (json) => {
        var _a;
        getVersions();
        getDocPermissions();
        setUpdatedAt((_a = json === null || json === void 0 ? void 0 : json.result) === null || _a === void 0 ? void 0 : _a.updatedAt);
        const state = await (0, buildStateFromSchema_1.default)({ fieldSchema: fields, data: json.result, operation: 'update', user, locale, t });
        setInitialState(state);
    }, [getVersions, fields, user, locale, t, getDocPermissions]);
    const [{ data, isLoading: isLoadingData }] = (0, usePayloadAPI_1.default)(`${serverURL}${api}/globals/${slug}`, { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' }, initialData: null });
    const dataToRender = (locationState === null || locationState === void 0 ? void 0 : locationState.data) || data;
    (0, react_1.useEffect)(() => {
        const nav = [{
                label,
            }];
        setStepNav(nav);
    }, [setStepNav, label]);
    (0, react_1.useEffect)(() => {
        const awaitInitialState = async () => {
            const state = await (0, buildStateFromSchema_1.default)({ fieldSchema: fields, data: dataToRender, user, operation: 'update', locale, t });
            await getPreference(preferencesKey);
            setInitialState(state);
        };
        if (dataToRender)
            awaitInitialState();
    }, [dataToRender, fields, user, locale, getPreference, preferencesKey, t]);
    const isLoading = !initialState || !docPermissions || isLoadingData;
    return (react_1.default.createElement(RenderCustomComponent_1.default, { DefaultComponent: Default_1.default, CustomComponent: CustomEdit, componentProps: {
            isLoading,
            data: dataToRender,
            permissions: docPermissions,
            initialState,
            global,
            onSave,
            apiURL: `${serverURL}${api}/globals/${slug}${((_a = global.versions) === null || _a === void 0 ? void 0 : _a.drafts) ? '?draft=true' : ''}`,
            action: `${serverURL}${api}/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`,
            updatedAt: updatedAt || (dataToRender === null || dataToRender === void 0 ? void 0 : dataToRender.updatedAt),
        } }));
};
exports.default = GlobalView;
//# sourceMappingURL=index.js.map