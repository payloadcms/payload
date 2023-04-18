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
exports.useListRelationships = exports.RelationshipProvider = void 0;
const react_1 = __importStar(require("react"));
const qs_1 = __importDefault(require("qs"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../../utilities/Config");
const reducer_1 = require("./reducer");
const useDebounce_1 = __importDefault(require("../../../../../hooks/useDebounce"));
const Context = (0, react_1.createContext)({});
const RelationshipProvider = ({ children }) => {
    const [documents, dispatchDocuments] = (0, react_1.useReducer)(reducer_1.reducer, {});
    const debouncedDocuments = (0, useDebounce_1.default)(documents, 100);
    const config = (0, Config_1.useConfig)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const { serverURL, routes: { api }, } = config;
    (0, react_1.useEffect)(() => {
        Object.entries(debouncedDocuments).forEach(async ([slug, docs]) => {
            const idsToLoad = [];
            Object.entries(docs).forEach(([id, value]) => {
                if (value === null) {
                    idsToLoad.push(id);
                }
            });
            if (idsToLoad.length > 0) {
                const url = `${serverURL}${api}/${slug}`;
                const params = {
                    depth: 0,
                    'where[id][in]': idsToLoad,
                    locale: i18n.language,
                    limit: 250,
                };
                const query = qs_1.default.stringify(params, { addQueryPrefix: true });
                const result = await fetch(`${url}${query}`, {
                    credentials: 'include',
                    headers: {
                        'Accept-Language': i18n.language,
                    },
                });
                if (result.ok) {
                    const json = await result.json();
                    if (json.docs) {
                        dispatchDocuments({ type: 'ADD_LOADED', docs: json.docs, relationTo: slug, idsToLoad });
                    }
                }
                else {
                    dispatchDocuments({ type: 'ADD_LOADED', docs: [], relationTo: slug, idsToLoad });
                }
            }
        });
    }, [i18n, serverURL, api, debouncedDocuments]);
    const getRelationships = (0, react_1.useCallback)(async (relationships) => {
        dispatchDocuments({ type: 'REQUEST', docs: relationships });
    }, []);
    return (react_1.default.createElement(Context.Provider, { value: { getRelationships, documents } }, children));
};
exports.RelationshipProvider = RelationshipProvider;
const useListRelationships = () => (0, react_1.useContext)(Context);
exports.useListRelationships = useListRelationships;
//# sourceMappingURL=index.js.map