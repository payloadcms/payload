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
exports.useDocumentInfo = exports.DocumentInfoProvider = void 0;
const react_1 = __importStar(require("react"));
const qs_1 = __importDefault(require("qs"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../Config");
const Preferences_1 = require("../Preferences");
const Auth_1 = require("../Auth");
const Context = (0, react_1.createContext)({});
const DocumentInfoProvider = ({ children, global, collection, id, }) => {
    const { serverURL, routes: { api } } = (0, Config_1.useConfig)();
    const { getPreference } = (0, Preferences_1.usePreferences)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const { permissions } = (0, Auth_1.useAuth)();
    const [publishedDoc, setPublishedDoc] = (0, react_1.useState)(null);
    const [versions, setVersions] = (0, react_1.useState)(null);
    const [unpublishedVersions, setUnpublishedVersions] = (0, react_1.useState)(null);
    const [docPermissions, setDocPermissions] = (0, react_1.useState)(null);
    const baseURL = `${serverURL}${api}`;
    let slug;
    let type;
    let pluralType;
    let preferencesKey;
    if (global) {
        slug = global.slug;
        type = 'global';
        pluralType = 'globals';
        preferencesKey = `global-${slug}`;
    }
    if (collection) {
        slug = collection.slug;
        type = 'collection';
        pluralType = 'collections';
        if (id) {
            preferencesKey = `collection-${slug}-${id}`;
        }
    }
    const getVersions = (0, react_1.useCallback)(async () => {
        var _a;
        let versionFetchURL;
        let publishedFetchURL;
        let shouldFetchVersions = false;
        let unpublishedVersionJSON = null;
        let versionJSON = null;
        let shouldFetch = true;
        const versionParams = {
            where: {
                and: [],
            },
            depth: 0,
        };
        const publishedVersionParams = {
            where: {
                and: [
                    {
                        or: [
                            {
                                _status: {
                                    equals: 'published',
                                },
                            },
                            {
                                _status: {
                                    exists: false,
                                },
                            },
                        ],
                    },
                ],
            },
            depth: 0,
        };
        if (global) {
            shouldFetchVersions = Boolean(global === null || global === void 0 ? void 0 : global.versions);
            versionFetchURL = `${baseURL}/globals/${global.slug}/versions`;
            publishedFetchURL = `${baseURL}/globals/${global.slug}?${qs_1.default.stringify(publishedVersionParams)}`;
        }
        if (collection) {
            shouldFetchVersions = Boolean(collection === null || collection === void 0 ? void 0 : collection.versions);
            versionFetchURL = `${baseURL}/${collection.slug}/versions`;
            publishedVersionParams.where.and.push({
                id: {
                    equals: id,
                },
            });
            publishedFetchURL = `${baseURL}/${collection.slug}?${qs_1.default.stringify(publishedVersionParams)}`;
            if (!id) {
                shouldFetch = false;
            }
            versionParams.where.and.push({
                parent: {
                    equals: id,
                },
            });
        }
        if (shouldFetch) {
            let publishedJSON = await fetch(publishedFetchURL, {
                credentials: 'include',
                headers: {
                    'Accept-Language': i18n.language,
                },
            }).then((res) => res.json());
            if (collection) {
                publishedJSON = (_a = publishedJSON === null || publishedJSON === void 0 ? void 0 : publishedJSON.docs) === null || _a === void 0 ? void 0 : _a[0];
            }
            if (shouldFetchVersions) {
                versionJSON = await fetch(`${versionFetchURL}?${qs_1.default.stringify(versionParams)}`, {
                    credentials: 'include',
                    headers: {
                        'Accept-Language': i18n.language,
                    },
                }).then((res) => res.json());
                if (publishedJSON === null || publishedJSON === void 0 ? void 0 : publishedJSON.updatedAt) {
                    const newerVersionParams = {
                        ...versionParams,
                        where: {
                            ...versionParams.where,
                            and: [
                                ...versionParams.where.and,
                                {
                                    updatedAt: {
                                        greater_than: publishedJSON === null || publishedJSON === void 0 ? void 0 : publishedJSON.updatedAt,
                                    },
                                },
                            ],
                        },
                    };
                    // Get any newer versions available
                    const newerVersionRes = await fetch(`${versionFetchURL}?${qs_1.default.stringify(newerVersionParams)}`, {
                        credentials: 'include',
                        headers: {
                            'Accept-Language': i18n.language,
                        },
                    });
                    if (newerVersionRes.status === 200) {
                        unpublishedVersionJSON = await newerVersionRes.json();
                    }
                }
            }
            setPublishedDoc(publishedJSON);
            setVersions(versionJSON);
            setUnpublishedVersions(unpublishedVersionJSON);
        }
    }, [i18n, global, collection, id, baseURL]);
    const getDocPermissions = react_1.default.useCallback(async () => {
        let docAccessURL;
        if (pluralType === 'globals') {
            docAccessURL = `/globals/${slug}/access`;
        }
        else if (pluralType === 'collections' && id) {
            docAccessURL = `/${slug}/access/${id}`;
        }
        if (docAccessURL) {
            const res = await fetch(`${serverURL}${api}${docAccessURL}`);
            const json = await res.json();
            setDocPermissions(json);
        }
        else {
            // fallback to permissions from the entity type
            // (i.e. create has no id)
            setDocPermissions(permissions[pluralType][slug]);
        }
    }, [serverURL, api, pluralType, slug, id, permissions]);
    (0, react_1.useEffect)(() => {
        getVersions();
    }, [getVersions]);
    (0, react_1.useEffect)(() => {
        if (preferencesKey) {
            const getDocPreferences = async () => {
                await getPreference(preferencesKey);
            };
            getDocPreferences();
        }
    }, [getPreference, preferencesKey]);
    (0, react_1.useEffect)(() => {
        getDocPermissions();
    }, [getDocPermissions]);
    const value = {
        slug,
        type,
        preferencesKey,
        global,
        collection,
        versions,
        unpublishedVersions,
        getVersions,
        publishedDoc,
        id,
        getDocPermissions,
        docPermissions,
    };
    return (react_1.default.createElement(Context.Provider, { value: value }, children));
};
exports.DocumentInfoProvider = DocumentInfoProvider;
const useDocumentInfo = () => (0, react_1.useContext)(Context);
exports.useDocumentInfo = useDocumentInfo;
//# sourceMappingURL=index.js.map