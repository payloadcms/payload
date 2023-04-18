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
exports.AddNewRelation = void 0;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const Button_1 = __importDefault(require("../../../../elements/Button"));
const Popup_1 = __importDefault(require("../../../../elements/Popup"));
const useRelatedCollections_1 = require("./useRelatedCollections");
const Auth_1 = require("../../../../utilities/Auth");
const Plus_1 = __importDefault(require("../../../../icons/Plus"));
const getTranslation_1 = require("../../../../../../utilities/getTranslation");
const Tooltip_1 = __importDefault(require("../../../../elements/Tooltip"));
const DocumentDrawer_1 = require("../../../../elements/DocumentDrawer");
const Config_1 = require("../../../../utilities/Config");
require("./index.scss");
const baseClass = 'relationship-add-new';
const AddNewRelation = ({ path, hasMany, relationTo, value, setValue, dispatchOptions }) => {
    const relatedCollections = (0, useRelatedCollections_1.useRelatedCollections)(relationTo);
    const { permissions } = (0, Auth_1.useAuth)();
    const [show, setShow] = (0, react_1.useState)(false);
    const [selectedCollection, setSelectedCollection] = (0, react_1.useState)();
    const relatedToMany = relatedCollections.length > 1;
    const [collectionConfig, setCollectionConfig] = (0, react_1.useState)(() => (!relatedToMany ? relatedCollections[0] : undefined));
    const [popupOpen, setPopupOpen] = (0, react_1.useState)(false);
    const { t, i18n } = (0, react_i18next_1.useTranslation)('fields');
    const [showTooltip, setShowTooltip] = (0, react_1.useState)(false);
    const config = (0, Config_1.useConfig)();
    const [DocumentDrawer, DocumentDrawerToggler, { toggleDrawer, isDrawerOpen },] = (0, DocumentDrawer_1.useDocumentDrawer)({
        collectionSlug: collectionConfig === null || collectionConfig === void 0 ? void 0 : collectionConfig.slug,
    });
    const onSave = (0, react_1.useCallback)((json) => {
        const newValue = Array.isArray(relationTo) ? {
            relationTo: collectionConfig.slug,
            value: json.doc.id,
        } : json.doc.id;
        dispatchOptions({
            type: 'ADD',
            collection: collectionConfig,
            docs: [
                json.doc,
            ],
            sort: true,
            i18n,
            config,
        });
        if (hasMany) {
            setValue([...(Array.isArray(value) ? value : []), newValue]);
        }
        else {
            setValue(newValue);
        }
        setSelectedCollection(undefined);
    }, [relationTo, collectionConfig, dispatchOptions, i18n, hasMany, setValue, value, config]);
    const onPopopToggle = (0, react_1.useCallback)((state) => {
        setPopupOpen(state);
    }, []);
    (0, react_1.useEffect)(() => {
        if (permissions) {
            if (relatedCollections.length === 1) {
                setShow(permissions.collections[relatedCollections[0].slug].create.permission);
            }
            else {
                setShow(relatedCollections.some((collection) => permissions.collections[collection.slug].create.permission));
            }
        }
    }, [permissions, relatedCollections]);
    (0, react_1.useEffect)(() => {
        if (relatedToMany && selectedCollection) {
            setCollectionConfig(relatedCollections.find((collection) => collection.slug === selectedCollection));
        }
    }, [selectedCollection, relatedToMany, relatedCollections]);
    (0, react_1.useEffect)(() => {
        if (relatedToMany && collectionConfig) {
            // the drawer must be rendered on the page before before opening it
            // this is why 'selectedCollection' is different from 'collectionConfig'
            toggleDrawer();
            setSelectedCollection(undefined);
        }
    }, [toggleDrawer, relatedToMany, collectionConfig]);
    (0, react_1.useEffect)(() => {
        if (relatedToMany && !isDrawerOpen) {
            setCollectionConfig(undefined);
        }
    }, [isDrawerOpen, relatedToMany]);
    if (show) {
        return (react_1.default.createElement("div", { className: baseClass, id: `${path}-add-new` },
            relatedCollections.length === 1 && (react_1.default.createElement(react_1.Fragment, null,
                react_1.default.createElement(DocumentDrawerToggler, { className: `${baseClass}__add-button`, onMouseEnter: () => setShowTooltip(true), onMouseLeave: () => setShowTooltip(false), onClick: () => setShowTooltip(false) },
                    react_1.default.createElement(Tooltip_1.default, { className: `${baseClass}__tooltip`, show: showTooltip }, t('addNewLabel', { label: (0, getTranslation_1.getTranslation)(relatedCollections[0].labels.singular, i18n) })),
                    react_1.default.createElement(Plus_1.default, null)),
                react_1.default.createElement(DocumentDrawer, { onSave: onSave }))),
            relatedCollections.length > 1 && (react_1.default.createElement(react_1.Fragment, null,
                react_1.default.createElement(Popup_1.default, { buttonType: "custom", horizontalAlign: "center", onToggleOpen: onPopopToggle, button: (react_1.default.createElement(Button_1.default, { className: `${baseClass}__add-button`, buttonStyle: "none", tooltip: popupOpen ? undefined : t('addNew') },
                        react_1.default.createElement(Plus_1.default, null))), render: ({ close: closePopup }) => (react_1.default.createElement("ul", { className: `${baseClass}__relations` }, relatedCollections.map((relatedCollection) => {
                        if (permissions.collections[relatedCollection.slug].create.permission) {
                            return (react_1.default.createElement("li", { key: relatedCollection.slug },
                                react_1.default.createElement("button", { type: "button", className: `${baseClass}__relation-button ${baseClass}__relation-button--${relatedCollection.slug}`, onClick: () => {
                                        closePopup();
                                        setSelectedCollection(relatedCollection.slug);
                                    } }, (0, getTranslation_1.getTranslation)(relatedCollection.labels.singular, i18n))));
                        }
                        return null;
                    }))) }),
                collectionConfig && permissions.collections[collectionConfig.slug].create.permission && (react_1.default.createElement(DocumentDrawer, { onSave: onSave }))))));
    }
    return null;
};
exports.AddNewRelation = AddNewRelation;
//# sourceMappingURL=index.js.map