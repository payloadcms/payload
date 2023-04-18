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
const react_toastify_1 = require("react-toastify");
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Button_1 = __importDefault(require("../Button"));
const api_1 = require("../../../api");
const context_1 = require("../../forms/Form/context");
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'duplicate';
const Duplicate = ({ slug, collection, id }) => {
    const { push } = (0, react_router_dom_1.useHistory)();
    const modified = (0, context_1.useFormModified)();
    const { toggleModal } = (0, modal_1.useModal)();
    const { setModified } = (0, context_1.useForm)();
    const { serverURL, routes: { api }, localization } = (0, Config_1.useConfig)();
    const { routes: { admin } } = (0, Config_1.useConfig)();
    const [hasClicked, setHasClicked] = (0, react_1.useState)(false);
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const modalSlug = `duplicate-${id}`;
    const handleClick = (0, react_1.useCallback)(async (override = false) => {
        setHasClicked(true);
        if (modified && !override) {
            toggleModal(modalSlug);
            return;
        }
        const create = async (locale = '') => {
            var _a;
            const response = await api_1.requests.get(`${serverURL}${api}/${slug}/${id}`, {
                params: {
                    locale,
                    depth: 0,
                },
                headers: {
                    'Accept-Language': i18n.language,
                },
            });
            let data = await response.json();
            if ('createdAt' in data)
                delete data.createdAt;
            if ('updatedAt' in data)
                delete data.updatedAt;
            if (typeof ((_a = collection.admin.hooks) === null || _a === void 0 ? void 0 : _a.beforeDuplicate) === 'function') {
                data = await collection.admin.hooks.beforeDuplicate({
                    data,
                    locale,
                });
            }
            const result = await api_1.requests.post(`${serverURL}${api}/${slug}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': i18n.language,
                },
                body: JSON.stringify(data),
            });
            const json = await result.json();
            if (result.status === 201) {
                return json.doc.id;
            }
            json.errors.forEach((error) => react_toastify_1.toast.error(error.message));
            return null;
        };
        let duplicateID;
        if (localization) {
            duplicateID = await create(localization.defaultLocale);
            let abort = false;
            localization.locales
                .filter((locale) => locale !== localization.defaultLocale)
                .forEach(async (locale) => {
                var _a;
                if (!abort) {
                    const res = await api_1.requests.get(`${serverURL}${api}/${slug}/${id}`, {
                        params: {
                            locale,
                            depth: 0,
                        },
                        headers: {
                            'Accept-Language': i18n.language,
                        },
                    });
                    let localizedDoc = await res.json();
                    if (typeof ((_a = collection.admin.hooks) === null || _a === void 0 ? void 0 : _a.beforeDuplicate) === 'function') {
                        localizedDoc = await collection.admin.hooks.beforeDuplicate({
                            data: localizedDoc,
                            locale,
                        });
                    }
                    const patchResult = await api_1.requests.patch(`${serverURL}${api}/${slug}/${duplicateID}?locale=${locale}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept-Language': i18n.language,
                        },
                        body: JSON.stringify(localizedDoc),
                    });
                    if (patchResult.status > 400) {
                        abort = true;
                        const json = await patchResult.json();
                        json.errors.forEach((error) => react_toastify_1.toast.error(error.message));
                    }
                }
            });
            if (abort) {
                // delete the duplicate doc to prevent incomplete
                await api_1.requests.delete(`${serverURL}${api}/${slug}/${id}`, {
                    headers: {
                        'Accept-Language': i18n.language,
                    },
                });
            }
        }
        else {
            duplicateID = await create();
        }
        react_toastify_1.toast.success(t('successfullyDuplicated', { label: (0, getTranslation_1.getTranslation)(collection.labels.singular, i18n) }), { autoClose: 3000 });
        setModified(false);
        setTimeout(() => {
            push({
                pathname: `${admin}/collections/${slug}/${duplicateID}`,
            });
        }, 10);
    }, [modified, localization, t, i18n, collection, setModified, toggleModal, modalSlug, serverURL, api, slug, id, push, admin]);
    const confirm = (0, react_1.useCallback)(async () => {
        setHasClicked(false);
        await handleClick(true);
    }, [handleClick]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Button_1.default, { id: "action-duplicate", buttonStyle: "none", className: baseClass, onClick: () => handleClick(false) }, t('duplicate')),
        modified && hasClicked && (react_1.default.createElement(modal_1.Modal, { slug: modalSlug, className: `${baseClass}__modal` },
            react_1.default.createElement(Minimal_1.default, { className: `${baseClass}__modal-template` },
                react_1.default.createElement("h1", null, t('confirmDuplication')),
                react_1.default.createElement("p", null, t('unsavedChangesDuplicate')),
                react_1.default.createElement(Button_1.default, { id: "confirm-cancel", buttonStyle: "secondary", type: "button", onClick: () => toggleModal(modalSlug) }, t('cancel')),
                react_1.default.createElement(Button_1.default, { onClick: confirm, id: "confirm-duplicate" }, t('duplicateWithoutSaving')))))));
};
exports.default = Duplicate;
//# sourceMappingURL=index.js.map