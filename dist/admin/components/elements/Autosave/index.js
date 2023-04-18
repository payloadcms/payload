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
const react_router_dom_1 = require("react-router-dom");
const react_toastify_1 = require("react-toastify");
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const context_1 = require("../../forms/Form/context");
const Locale_1 = require("../../utilities/Locale");
const reduceFieldsToValues_1 = __importDefault(require("../../forms/Form/reduceFieldsToValues"));
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const useDebounce_1 = __importDefault(require("../../../hooks/useDebounce"));
require("./index.scss");
const baseClass = 'autosave';
const Autosave = ({ collection, global, id, publishedDocUpdatedAt }) => {
    var _a, _b, _c, _d;
    const { serverURL, routes: { api, admin } } = (0, Config_1.useConfig)();
    const { versions, getVersions } = (0, DocumentInfo_1.useDocumentInfo)();
    const [fields] = (0, context_1.useAllFormFields)();
    const modified = (0, context_1.useFormModified)();
    const locale = (0, Locale_1.useLocale)();
    const { replace } = (0, react_router_dom_1.useHistory)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('version');
    let interval = 800;
    if ((collection === null || collection === void 0 ? void 0 : collection.versions.drafts) && ((_b = (_a = collection.versions) === null || _a === void 0 ? void 0 : _a.drafts) === null || _b === void 0 ? void 0 : _b.autosave))
        interval = collection.versions.drafts.autosave.interval;
    if ((global === null || global === void 0 ? void 0 : global.versions.drafts) && ((_d = (_c = global.versions) === null || _c === void 0 ? void 0 : _c.drafts) === null || _d === void 0 ? void 0 : _d.autosave))
        interval = global.versions.drafts.autosave.interval;
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [lastSaved, setLastSaved] = (0, react_1.useState)();
    const debouncedFields = (0, useDebounce_1.default)(fields, interval);
    const fieldRef = (0, react_1.useRef)(fields);
    const modifiedRef = (0, react_1.useRef)(modified);
    // Store fields in ref so the autosave func
    // can always retrieve the most to date copies
    // after the timeout has executed
    fieldRef.current = fields;
    // Store modified in ref so the autosave func
    // can bail out if modified becomes false while
    // timing out during autosave
    modifiedRef.current = modified;
    const createCollectionDoc = (0, react_1.useCallback)(async () => {
        const res = await fetch(`${serverURL}${api}/${collection.slug}?locale=${locale}&fallback-locale=null&depth=0&draft=true&autosave=true`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': i18n.language,
            },
            body: JSON.stringify({}),
        });
        if (res.status === 201) {
            const json = await res.json();
            replace(`${admin}/collections/${collection.slug}/${json.doc.id}`, {
                state: {
                    data: json.doc,
                },
            });
        }
        else {
            react_toastify_1.toast.error(t('error:autosaving'));
        }
    }, [i18n, serverURL, api, collection, locale, replace, admin, t]);
    (0, react_1.useEffect)(() => {
        // If no ID, but this is used for a collection doc,
        // Immediately save it and set lastSaved
        if (!id && collection) {
            createCollectionDoc();
        }
    }, [id, collection, createCollectionDoc]);
    // When debounced fields change, autosave
    (0, react_1.useEffect)(() => {
        const autosave = async () => {
            if (modified) {
                setSaving(true);
                let url;
                let method;
                if (collection && id) {
                    url = `${serverURL}${api}/${collection.slug}/${id}?draft=true&autosave=true&locale=${locale}`;
                    method = 'PATCH';
                }
                if (global) {
                    url = `${serverURL}${api}/globals/${global.slug}?draft=true&autosave=true&locale=${locale}`;
                    method = 'POST';
                }
                if (url) {
                    setTimeout(async () => {
                        if (modifiedRef.current) {
                            const body = {
                                ...(0, reduceFieldsToValues_1.default)(fieldRef.current, true),
                                _status: 'draft',
                            };
                            const res = await fetch(url, {
                                method,
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept-Language': i18n.language,
                                },
                                body: JSON.stringify(body),
                            });
                            if (res.status === 200) {
                                setLastSaved(new Date().getTime());
                                getVersions();
                            }
                        }
                        setSaving(false);
                    }, 1000);
                }
            }
        };
        autosave();
    }, [i18n, debouncedFields, modified, serverURL, api, collection, global, id, getVersions, locale, modifiedRef]);
    (0, react_1.useEffect)(() => {
        var _a;
        if ((_a = versions === null || versions === void 0 ? void 0 : versions.docs) === null || _a === void 0 ? void 0 : _a[0]) {
            setLastSaved(new Date(versions.docs[0].updatedAt).getTime());
        }
        else if (publishedDocUpdatedAt) {
            setLastSaved(new Date(publishedDocUpdatedAt).getTime());
        }
    }, [publishedDocUpdatedAt, versions]);
    return (react_1.default.createElement("div", { className: baseClass },
        saving && t('saving'),
        (!saving && lastSaved) && (react_1.default.createElement(react_1.default.Fragment, null, t('lastSavedAgo', {
            distance: Math.round((Number(new Date(lastSaved)) - Number(new Date())) / 1000 / 60),
        })))));
};
exports.default = Autosave;
//# sourceMappingURL=index.js.map