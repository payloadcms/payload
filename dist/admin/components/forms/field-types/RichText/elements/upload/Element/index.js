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
const slate_1 = require("slate");
const slate_react_1 = require("slate-react");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../../../../utilities/Config");
const usePayloadAPI_1 = __importDefault(require("../../../../../../../hooks/usePayloadAPI"));
const File_1 = __importDefault(require("../../../../../../graphics/File"));
const useThumbnail_1 = __importDefault(require("../../../../../../../hooks/useThumbnail"));
const Button_1 = __importDefault(require("../../../../../../elements/Button"));
const getTranslation_1 = require("../../../../../../../../utilities/getTranslation");
const DocumentDrawer_1 = require("../../../../../../elements/DocumentDrawer");
const ListDrawer_1 = require("../../../../../../elements/ListDrawer");
const EnabledRelationshipsCondition_1 = require("../../EnabledRelationshipsCondition");
const useDrawerSlug_1 = require("../../../../../../elements/Drawer/useDrawerSlug");
const UploadDrawer_1 = require("./UploadDrawer");
const Drawer_1 = require("../../../../../../elements/Drawer");
require("./index.scss");
const baseClass = 'rich-text-upload';
const initialParams = {
    depth: 0,
};
const Element = (props) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { attributes, children, element, element: { relationTo, value, }, fieldProps, enabledCollectionSlugs, } = props;
    const { collections, serverURL, routes: { api } } = (0, Config_1.useConfig)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('fields');
    const [cacheBust, dispatchCacheBust] = (0, react_1.useReducer)((state) => state + 1, 0);
    const [relatedCollection, setRelatedCollection] = (0, react_1.useState)(() => collections.find((coll) => coll.slug === relationTo));
    const drawerSlug = (0, useDrawerSlug_1.useDrawerSlug)('upload-drawer');
    const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer, },] = (0, ListDrawer_1.useListDrawer)({
        collectionSlugs: enabledCollectionSlugs,
        selectedCollection: relatedCollection.slug,
    });
    const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, },] = (0, DocumentDrawer_1.useDocumentDrawer)({
        collectionSlug: relatedCollection.slug,
        id: value === null || value === void 0 ? void 0 : value.id,
    });
    const editor = (0, slate_react_1.useSlateStatic)();
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    // Get the referenced document
    const [{ data }, { setParams }] = (0, usePayloadAPI_1.default)(`${serverURL}${api}/${relatedCollection.slug}/${value === null || value === void 0 ? void 0 : value.id}`, { initialParams });
    const thumbnailSRC = (0, useThumbnail_1.default)(relatedCollection, data);
    const removeUpload = (0, react_1.useCallback)(() => {
        const elementPath = slate_react_1.ReactEditor.findPath(editor, element);
        slate_1.Transforms.removeNodes(editor, { at: elementPath });
    }, [editor, element]);
    const updateUpload = (0, react_1.useCallback)((json) => {
        const { doc } = json;
        const newNode = {
            fields: doc,
        };
        const elementPath = slate_react_1.ReactEditor.findPath(editor, element);
        slate_1.Transforms.setNodes(editor, newNode, { at: elementPath });
        // setRelatedCollection(collections.find((coll) => coll.slug === collectionConfig.slug));
        setParams({
            ...initialParams,
            cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
        });
        dispatchCacheBust();
        closeDrawer();
    }, [editor, element, setParams, cacheBust, closeDrawer]);
    const swapUpload = react_1.default.useCallback(({ docID, collectionConfig }) => {
        const newNode = {
            type: 'upload',
            value: { id: docID },
            relationTo: collectionConfig.slug,
            children: [
                { text: ' ' },
            ],
        };
        const elementPath = slate_react_1.ReactEditor.findPath(editor, element);
        setRelatedCollection(collections.find((coll) => coll.slug === collectionConfig.slug));
        slate_1.Transforms.setNodes(editor, newNode, { at: elementPath });
        dispatchCacheBust();
        closeListDrawer();
    }, [closeListDrawer, editor, element, collections]);
    const customFields = (_d = (_c = (_b = (_a = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _a === void 0 ? void 0 : _a.upload) === null || _b === void 0 ? void 0 : _b.collections) === null || _c === void 0 ? void 0 : _c[relatedCollection.slug]) === null || _d === void 0 ? void 0 : _d.fields;
    return (react_1.default.createElement("div", { className: [
            baseClass,
            (selected && focused) && `${baseClass}--selected`,
        ].filter(Boolean).join(' '), contentEditable: false, ...attributes },
        react_1.default.createElement("div", { className: `${baseClass}__card` },
            react_1.default.createElement("div", { className: `${baseClass}__topRow` },
                react_1.default.createElement("div", { className: `${baseClass}__thumbnail` }, thumbnailSRC ? (react_1.default.createElement("img", { src: thumbnailSRC, alt: data === null || data === void 0 ? void 0 : data.filename })) : (react_1.default.createElement(File_1.default, null))),
                react_1.default.createElement("div", { className: `${baseClass}__topRowRightPanel` },
                    react_1.default.createElement("div", { className: `${baseClass}__collectionLabel` }, (0, getTranslation_1.getTranslation)(relatedCollection.labels.singular, i18n)),
                    react_1.default.createElement("div", { className: `${baseClass}__actions` },
                        (customFields === null || customFields === void 0 ? void 0 : customFields.length) > 0 && (react_1.default.createElement(Drawer_1.DrawerToggler, { slug: drawerSlug, className: `${baseClass}__upload-drawer-toggler`, disabled: (_e = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _e === void 0 ? void 0 : _e.readOnly },
                            react_1.default.createElement(Button_1.default, { icon: "edit", round: true, buttonStyle: "icon-label", el: "div", onClick: (e) => {
                                    e.preventDefault();
                                }, tooltip: t('fields:editRelationship') }))),
                        react_1.default.createElement(ListDrawerToggler, { className: `${baseClass}__list-drawer-toggler`, disabled: (_f = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _f === void 0 ? void 0 : _f.readOnly },
                            react_1.default.createElement(Button_1.default, { icon: "swap", round: true, buttonStyle: "icon-label", onClick: () => {
                                    // do nothing
                                }, el: "div", tooltip: t('swapUpload'), disabled: (_g = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _g === void 0 ? void 0 : _g.readOnly })),
                        react_1.default.createElement(Button_1.default, { icon: "x", round: true, buttonStyle: "icon-label", className: `${baseClass}__removeButton`, onClick: (e) => {
                                e.preventDefault();
                                removeUpload();
                            }, tooltip: t('removeUpload'), disabled: (_h = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _h === void 0 ? void 0 : _h.readOnly })))),
            react_1.default.createElement("div", { className: `${baseClass}__bottomRow` },
                react_1.default.createElement(DocumentDrawerToggler, { className: `${baseClass}__doc-drawer-toggler` },
                    react_1.default.createElement("strong", null, data === null || data === void 0 ? void 0 : data.filename)))),
        children,
        (value === null || value === void 0 ? void 0 : value.id) && (react_1.default.createElement(DocumentDrawer, { onSave: updateUpload })),
        react_1.default.createElement(ListDrawer, { onSelect: swapUpload }),
        react_1.default.createElement(UploadDrawer_1.UploadDrawer, { drawerSlug: drawerSlug, relatedCollection: relatedCollection, ...props })));
};
exports.default = (props) => {
    return (react_1.default.createElement(EnabledRelationshipsCondition_1.EnabledRelationshipsCondition, { ...props, uploads: true },
        react_1.default.createElement(Element, { ...props })));
};
//# sourceMappingURL=index.js.map