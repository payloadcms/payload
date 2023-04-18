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
const react_i18next_1 = require("react-i18next");
const slate_react_1 = require("slate-react");
const Button_1 = __importDefault(require("../../Button"));
const Upload_1 = __importDefault(require("../../../../../../icons/Upload"));
const ListDrawer_1 = require("../../../../../../elements/ListDrawer");
const injectVoid_1 = require("../../injectVoid");
const EnabledRelationshipsCondition_1 = require("../../EnabledRelationshipsCondition");
require("./index.scss");
const baseClass = 'upload-rich-text-button';
const insertUpload = (editor, { value, relationTo }) => {
    const text = { text: ' ' };
    const upload = {
        type: 'upload',
        value,
        relationTo,
        children: [
            text,
        ],
    };
    (0, injectVoid_1.injectVoidElement)(editor, upload);
    slate_react_1.ReactEditor.focus(editor);
};
const UploadButton = ({ enabledCollectionSlugs }) => {
    const { t } = (0, react_i18next_1.useTranslation)(['upload', 'general']);
    const editor = (0, slate_react_1.useSlate)();
    const [ListDrawer, ListDrawerToggler, { closeDrawer, },] = (0, ListDrawer_1.useListDrawer)({
        uploads: true,
        collectionSlugs: enabledCollectionSlugs,
    });
    const onSelect = (0, react_1.useCallback)(({ docID, collectionConfig }) => {
        insertUpload(editor, {
            value: {
                id: docID,
            },
            relationTo: collectionConfig.slug,
        });
        closeDrawer();
    }, [editor, closeDrawer]);
    return (react_1.default.createElement(react_1.Fragment, null,
        react_1.default.createElement(ListDrawerToggler, null,
            react_1.default.createElement(Button_1.default, { className: baseClass, format: "upload", tooltip: t('fields:addUpload'), el: "div", onClick: () => {
                    // do nothing
                } },
                react_1.default.createElement(Upload_1.default, null))),
        react_1.default.createElement(ListDrawer, { onSelect: onSelect })));
};
exports.default = (props) => {
    return (react_1.default.createElement(EnabledRelationshipsCondition_1.EnabledRelationshipsCondition, { ...props, uploads: true },
        react_1.default.createElement(UploadButton, { ...props })));
};
//# sourceMappingURL=index.js.map