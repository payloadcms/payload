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
exports.LinkButton = void 0;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const slate_react_1 = require("slate-react");
const slate_1 = require("slate");
const modal_1 = require("@faceless-ui/modal");
const Button_1 = __importDefault(require("../../Button"));
const Link_1 = __importDefault(require("../../../../../../icons/Link"));
const reduceFieldsToValues_1 = __importDefault(require("../../../../../Form/reduceFieldsToValues"));
const Config_1 = require("../../../../../../utilities/Config");
const isActive_1 = __importDefault(require("../../isActive"));
const utilities_1 = require("../utilities");
const baseFields_1 = require("../LinkDrawer/baseFields");
const LinkDrawer_1 = require("../LinkDrawer");
const buildStateFromSchema_1 = __importDefault(require("../../../../../Form/buildStateFromSchema"));
const Auth_1 = require("../../../../../../utilities/Auth");
const Locale_1 = require("../../../../../../utilities/Locale");
const useDrawerSlug_1 = require("../../../../../../elements/Drawer/useDrawerSlug");
const insertLink = (editor, fields) => {
    const isCollapsed = editor.selection && slate_1.Range.isCollapsed(editor.selection);
    const data = (0, reduceFieldsToValues_1.default)(fields, true);
    const newLink = {
        type: 'link',
        linkType: data.linkType,
        url: data.url,
        doc: data.doc,
        newTab: data.newTab,
        fields: data.fields,
        children: [],
    };
    if (isCollapsed || !editor.selection) {
        // If selection anchor and focus are the same,
        // Just inject a new node with children already set
        slate_1.Transforms.insertNodes(editor, {
            ...newLink,
            children: [{ text: String(data.text) }],
        });
    }
    else if (editor.selection) {
        // Otherwise we need to wrap the selected node in a link,
        // Delete its old text,
        // Move the selection one position forward into the link,
        // And insert the text back into the new link
        slate_1.Transforms.wrapNodes(editor, newLink, { split: true });
        slate_1.Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'word' });
        slate_1.Transforms.move(editor, { distance: 1, unit: 'offset' });
        slate_1.Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });
    }
    slate_react_1.ReactEditor.focus(editor);
};
const LinkButton = ({ fieldProps }) => {
    var _a, _b;
    const customFieldSchema = (_b = (_a = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _a === void 0 ? void 0 : _a.link) === null || _b === void 0 ? void 0 : _b.fields;
    const { user } = (0, Auth_1.useAuth)();
    const locale = (0, Locale_1.useLocale)();
    const [initialState, setInitialState] = (0, react_1.useState)({});
    const { t } = (0, react_i18next_1.useTranslation)(['upload', 'general']);
    const editor = (0, slate_react_1.useSlate)();
    const config = (0, Config_1.useConfig)();
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
    const { openModal, closeModal } = (0, modal_1.useModal)();
    const drawerSlug = (0, useDrawerSlug_1.useDrawerSlug)('rich-text-link');
    return (react_1.default.createElement(react_1.Fragment, null,
        react_1.default.createElement(Button_1.default, { format: "link", tooltip: t('fields:addLink'), className: "link", onClick: async () => {
                if ((0, isActive_1.default)(editor, 'link')) {
                    (0, utilities_1.unwrapLink)(editor);
                }
                else {
                    openModal(drawerSlug);
                    const isCollapsed = editor.selection && slate_1.Range.isCollapsed(editor.selection);
                    if (!isCollapsed) {
                        const data = {
                            text: editor.selection ? slate_1.Editor.string(editor, editor.selection) : '',
                        };
                        const state = await (0, buildStateFromSchema_1.default)({ fieldSchema, data, user, operation: 'create', locale, t });
                        setInitialState(state);
                    }
                }
            } },
            react_1.default.createElement(Link_1.default, null)),
        react_1.default.createElement(LinkDrawer_1.LinkDrawer, { drawerSlug: drawerSlug, handleModalSubmit: (fields) => {
                insertLink(editor, fields);
                closeModal(drawerSlug);
            }, initialState: initialState, fieldSchema: fieldSchema, handleClose: () => {
                closeModal(drawerSlug);
            } })));
};
exports.LinkButton = LinkButton;
//# sourceMappingURL=index.js.map