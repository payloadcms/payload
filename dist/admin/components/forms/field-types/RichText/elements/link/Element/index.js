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
exports.LinkElement = void 0;
const react_1 = __importStar(require("react"));
const slate_react_1 = require("slate-react");
const slate_1 = require("slate");
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const utilities_1 = require("../utilities");
const Popup_1 = __importDefault(require("../../../../../../elements/Popup"));
const LinkDrawer_1 = require("../LinkDrawer");
const buildStateFromSchema_1 = __importDefault(require("../../../../../Form/buildStateFromSchema"));
const Auth_1 = require("../../../../../../utilities/Auth");
const Locale_1 = require("../../../../../../utilities/Locale");
const Config_1 = require("../../../../../../utilities/Config");
const baseFields_1 = require("../LinkDrawer/baseFields");
const reduceFieldsToValues_1 = __importDefault(require("../../../../../Form/reduceFieldsToValues"));
const deepCopyObject_1 = __importDefault(require("../../../../../../../../utilities/deepCopyObject"));
const Button_1 = __importDefault(require("../../../../../../elements/Button"));
const getTranslation_1 = require("../../../../../../../../utilities/getTranslation");
require("./index.scss");
const useDrawerSlug_1 = require("../../../../../../elements/Drawer/useDrawerSlug");
const baseClass = 'rich-text-link';
const insertChange = (editor, fields, customFieldSchema) => {
    const data = (0, reduceFieldsToValues_1.default)(fields, true);
    const [, parentPath] = slate_1.Editor.above(editor);
    const newNode = {
        newTab: data.newTab,
        url: data.url,
        linkType: data.linkType,
        doc: data.doc,
    };
    if (customFieldSchema) {
        newNode.fields = data.fields;
    }
    slate_1.Transforms.setNodes(editor, newNode, { at: parentPath });
    slate_1.Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'block' });
    slate_1.Transforms.move(editor, { distance: 1, unit: 'offset' });
    slate_1.Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });
    slate_react_1.ReactEditor.focus(editor);
};
const LinkElement = (props) => {
    var _a, _b;
    const { attributes, children, element, editorRef, fieldProps, } = props;
    const customFieldSchema = (_b = (_a = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _a === void 0 ? void 0 : _a.link) === null || _b === void 0 ? void 0 : _b.fields;
    const editor = (0, slate_react_1.useSlate)();
    const config = (0, Config_1.useConfig)();
    const { user } = (0, Auth_1.useAuth)();
    const locale = (0, Locale_1.useLocale)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('fields');
    const { openModal, toggleModal, closeModal } = (0, modal_1.useModal)();
    const [renderModal, setRenderModal] = (0, react_1.useState)(false);
    const [renderPopup, setRenderPopup] = (0, react_1.useState)(false);
    const [initialState, setInitialState] = (0, react_1.useState)({});
    const [fieldSchema] = (0, react_1.useState)(() => {
        const fields = [
            ...(0, baseFields_1.getBaseFields)(config),
        ];
        if (customFieldSchema) {
            fields.push({
                name: 'fields',
                type: 'group',
                admin: {
                    style: {
                        margin: 0,
                        padding: 0,
                        borderTop: 0,
                        borderBottom: 0,
                    },
                },
                fields: customFieldSchema,
            });
        }
        return fields;
    });
    const drawerSlug = (0, useDrawerSlug_1.useDrawerSlug)('rich-text-link');
    const handleTogglePopup = (0, react_1.useCallback)((render) => {
        if (!render) {
            setRenderPopup(render);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        const awaitInitialState = async () => {
            const data = {
                text: slate_1.Node.string(element),
                linkType: element.linkType,
                url: element.url,
                doc: element.doc,
                newTab: element.newTab,
                fields: (0, deepCopyObject_1.default)(element.fields),
            };
            const state = await (0, buildStateFromSchema_1.default)({ fieldSchema, data, user, operation: 'update', locale, t });
            setInitialState(state);
        };
        awaitInitialState();
    }, [renderModal, element, fieldSchema, user, locale, t]);
    return (react_1.default.createElement("span", { className: baseClass, ...attributes },
        react_1.default.createElement("span", { style: { userSelect: 'none' }, contentEditable: false },
            renderModal && (react_1.default.createElement(LinkDrawer_1.LinkDrawer, { drawerSlug: drawerSlug, fieldSchema: fieldSchema, handleClose: () => {
                    toggleModal(drawerSlug);
                    setRenderModal(false);
                }, handleModalSubmit: (fields) => {
                    insertChange(editor, fields, customFieldSchema);
                    closeModal(drawerSlug);
                }, initialState: initialState })),
            react_1.default.createElement(Popup_1.default, { buttonType: "none", size: "small", forceOpen: renderPopup, onToggleOpen: handleTogglePopup, horizontalAlign: "left", verticalAlign: "bottom", boundingRef: editorRef, render: () => {
                    var _a, _b, _c, _d;
                    return (react_1.default.createElement("div", { className: `${baseClass}__popup` },
                        element.linkType === 'internal' && ((_a = element.doc) === null || _a === void 0 ? void 0 : _a.relationTo) && ((_b = element.doc) === null || _b === void 0 ? void 0 : _b.value) && (react_1.default.createElement(react_i18next_1.Trans, { i18nKey: "fields:linkedTo", values: { label: (0, getTranslation_1.getTranslation)((_d = (_c = config.collections.find(({ slug }) => slug === element.doc.relationTo)) === null || _c === void 0 ? void 0 : _c.labels) === null || _d === void 0 ? void 0 : _d.singular, i18n) } },
                            react_1.default.createElement("a", { className: `${baseClass}__link-label`, href: `${config.routes.admin}/collections/${element.doc.relationTo}/${element.doc.value}`, target: "_blank", rel: "noreferrer" }, "label"))),
                        (element.linkType === 'custom' || !element.linkType) && (react_1.default.createElement("a", { className: `${baseClass}__link-label`, href: element.url, target: "_blank", rel: "noreferrer" }, element.url)),
                        react_1.default.createElement(Button_1.default, { className: `${baseClass}__link-edit`, icon: "edit", round: true, buttonStyle: "icon-label", onClick: (e) => {
                                e.preventDefault();
                                setRenderPopup(false);
                                openModal(drawerSlug);
                                setRenderModal(true);
                            }, tooltip: t('general:edit') }),
                        react_1.default.createElement(Button_1.default, { className: `${baseClass}__link-close`, icon: "x", round: true, buttonStyle: "icon-label", onClick: (e) => {
                                e.preventDefault();
                                (0, utilities_1.unwrapLink)(editor);
                            }, tooltip: t('general:remove') })));
                } })),
        react_1.default.createElement("span", { tabIndex: 0, role: "button", className: [
                `${baseClass}__popup-toggler`,
            ].filter(Boolean).join(' '), onKeyDown: (e) => { if (e.key === 'Enter')
                setRenderPopup(true); }, onClick: () => setRenderPopup(true) }, children)));
};
exports.LinkElement = LinkElement;
//# sourceMappingURL=index.js.map