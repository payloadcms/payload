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
const slate_react_1 = require("slate-react");
const react_i18next_1 = require("react-i18next");
const slate_1 = require("slate");
const Config_1 = require("../../../../../../utilities/Config");
const usePayloadAPI_1 = __importDefault(require("../../../../../../../hooks/usePayloadAPI"));
const DocumentDrawer_1 = require("../../../../../../elements/DocumentDrawer");
const Button_1 = __importDefault(require("../../../../../../elements/Button"));
const ListDrawer_1 = require("../../../../../../elements/ListDrawer");
const getTranslation_1 = require("../../../../../../../../utilities/getTranslation");
const EnabledRelationshipsCondition_1 = require("../../EnabledRelationshipsCondition");
require("./index.scss");
const baseClass = 'rich-text-relationship';
const initialParams = {
    depth: 0,
};
const Element = (props) => {
    var _a, _b, _c, _d;
    const { attributes, children, element, element: { relationTo, value, }, fieldProps, } = props;
    const { collections, serverURL, routes: { api } } = (0, Config_1.useConfig)();
    const [enabledCollectionSlugs] = (0, react_1.useState)(() => collections.filter(({ admin: { enableRichTextRelationship } }) => enableRichTextRelationship).map(({ slug }) => slug));
    const [relatedCollection, setRelatedCollection] = (0, react_1.useState)(() => collections.find((coll) => coll.slug === relationTo));
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)(['fields', 'general']);
    const editor = (0, slate_react_1.useSlateStatic)();
    const [cacheBust, dispatchCacheBust] = (0, react_1.useReducer)((state) => state + 1, 0);
    const [{ data }, { setParams }] = (0, usePayloadAPI_1.default)(`${serverURL}${api}/${relatedCollection.slug}/${value === null || value === void 0 ? void 0 : value.id}`, { initialParams });
    const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, },] = (0, DocumentDrawer_1.useDocumentDrawer)({
        collectionSlug: relatedCollection.slug,
        id: value === null || value === void 0 ? void 0 : value.id,
    });
    const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer, },] = (0, ListDrawer_1.useListDrawer)({
        collectionSlugs: enabledCollectionSlugs,
        selectedCollection: relatedCollection.slug,
    });
    const removeRelationship = (0, react_1.useCallback)(() => {
        const elementPath = slate_react_1.ReactEditor.findPath(editor, element);
        slate_1.Transforms.removeNodes(editor, { at: elementPath });
    }, [editor, element]);
    const updateRelationship = react_1.default.useCallback(({ doc }) => {
        const elementPath = slate_react_1.ReactEditor.findPath(editor, element);
        slate_1.Transforms.setNodes(editor, {
            type: 'relationship',
            value: { id: doc.id },
            relationTo: relatedCollection.slug,
            children: [
                { text: ' ' },
            ],
        }, { at: elementPath });
        setParams({
            ...initialParams,
            cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
        });
        closeDrawer();
        dispatchCacheBust();
    }, [editor, element, relatedCollection, cacheBust, setParams, closeDrawer]);
    const swapRelationship = react_1.default.useCallback(({ docID, collectionConfig }) => {
        const elementPath = slate_react_1.ReactEditor.findPath(editor, element);
        slate_1.Transforms.setNodes(editor, {
            type: 'relationship',
            value: { id: docID },
            relationTo: collectionConfig.slug,
            children: [
                { text: ' ' },
            ],
        }, { at: elementPath });
        setRelatedCollection(collections.find((coll) => coll.slug === collectionConfig.slug));
        setParams({
            ...initialParams,
            cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
        });
        closeListDrawer();
        dispatchCacheBust();
    }, [closeListDrawer, editor, element, cacheBust, setParams, collections]);
    return (react_1.default.createElement("div", { className: [
            baseClass,
            (selected && focused) && `${baseClass}--selected`,
        ].filter(Boolean).join(' '), contentEditable: false, ...attributes },
        react_1.default.createElement("div", { className: `${baseClass}__wrap` },
            react_1.default.createElement("p", { className: `${baseClass}__label` }, t('labelRelationship', { label: (0, getTranslation_1.getTranslation)(relatedCollection.labels.singular, i18n) })),
            react_1.default.createElement(DocumentDrawerToggler, { className: `${baseClass}__doc-drawer-toggler` },
                react_1.default.createElement("p", { className: `${baseClass}__title` }, data[((_a = relatedCollection === null || relatedCollection === void 0 ? void 0 : relatedCollection.admin) === null || _a === void 0 ? void 0 : _a.useAsTitle) || 'id']))),
        react_1.default.createElement("div", { className: `${baseClass}__actions` },
            react_1.default.createElement(ListDrawerToggler, { disabled: (_b = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _b === void 0 ? void 0 : _b.readOnly, className: `${baseClass}__list-drawer-toggler` },
                react_1.default.createElement(Button_1.default, { icon: "swap", round: true, buttonStyle: "icon-label", onClick: () => {
                        // do nothing
                    }, el: "div", tooltip: t('swapRelationship'), disabled: (_c = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _c === void 0 ? void 0 : _c.readOnly })),
            react_1.default.createElement(Button_1.default, { icon: "x", round: true, buttonStyle: "icon-label", className: `${baseClass}__removeButton`, onClick: (e) => {
                    e.preventDefault();
                    removeRelationship();
                }, tooltip: t('fields:removeRelationship'), disabled: (_d = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _d === void 0 ? void 0 : _d.readOnly })),
        (value === null || value === void 0 ? void 0 : value.id) && (react_1.default.createElement(DocumentDrawer, { onSave: updateRelationship })),
        react_1.default.createElement(ListDrawer, { onSelect: swapRelationship }),
        children));
};
exports.default = (props) => {
    return (react_1.default.createElement(EnabledRelationshipsCondition_1.EnabledRelationshipsCondition, { ...props },
        react_1.default.createElement(Element, { ...props })));
};
//# sourceMappingURL=index.js.map