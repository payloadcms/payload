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
exports.UploadDrawer = void 0;
const modal_1 = require("@faceless-ui/modal");
const slate_1 = require("slate");
const slate_react_1 = require("slate-react");
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const __1 = __importDefault(require("../../../../.."));
const Drawer_1 = require("../../../../../../../elements/Drawer");
const Auth_1 = require("../../../../../../../utilities/Auth");
const Locale_1 = require("../../../../../../../utilities/Locale");
const Form_1 = __importDefault(require("../../../../../../Form"));
const RenderFields_1 = __importDefault(require("../../../../../../RenderFields"));
const Submit_1 = __importDefault(require("../../../../../../Submit"));
const buildStateFromSchema_1 = __importDefault(require("../../../../../../Form/buildStateFromSchema"));
const getTranslation_1 = require("../../../../../../../../../utilities/getTranslation");
const deepCopyObject_1 = __importDefault(require("../../../../../../../../../utilities/deepCopyObject"));
const UploadDrawer = (props) => {
    var _a, _b, _c, _d;
    const editor = (0, slate_react_1.useSlateStatic)();
    const { fieldProps, relatedCollection, drawerSlug, element, } = props;
    const { t, i18n } = (0, react_i18next_1.useTranslation)();
    const locale = (0, Locale_1.useLocale)();
    const { user } = (0, Auth_1.useAuth)();
    const { closeModal } = (0, modal_1.useModal)();
    const [initialState, setInitialState] = (0, react_1.useState)({});
    const fieldSchema = (_d = (_c = (_b = (_a = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.admin) === null || _a === void 0 ? void 0 : _a.upload) === null || _b === void 0 ? void 0 : _b.collections) === null || _c === void 0 ? void 0 : _c[relatedCollection.slug]) === null || _d === void 0 ? void 0 : _d.fields;
    const handleUpdateEditData = (0, react_1.useCallback)((_, data) => {
        const newNode = {
            fields: data,
        };
        const elementPath = slate_react_1.ReactEditor.findPath(editor, element);
        slate_1.Transforms.setNodes(editor, newNode, { at: elementPath });
        closeModal(drawerSlug);
    }, [closeModal, editor, element, drawerSlug]);
    (0, react_1.useEffect)(() => {
        const awaitInitialState = async () => {
            const state = await (0, buildStateFromSchema_1.default)({ fieldSchema, data: (0, deepCopyObject_1.default)((element === null || element === void 0 ? void 0 : element.fields) || {}), user, operation: 'update', locale, t });
            setInitialState(state);
        };
        awaitInitialState();
    }, [fieldSchema, element.fields, user, locale, t]);
    return (react_1.default.createElement(Drawer_1.Drawer, { slug: drawerSlug, title: t('general:editLabel', { label: (0, getTranslation_1.getTranslation)(relatedCollection.labels.singular, i18n) }) },
        react_1.default.createElement(Form_1.default, { onSubmit: handleUpdateEditData, initialState: initialState },
            react_1.default.createElement(RenderFields_1.default, { readOnly: false, fieldTypes: __1.default, fieldSchema: fieldSchema }),
            react_1.default.createElement(Submit_1.default, null, t('fields:saveChanges')))));
};
exports.UploadDrawer = UploadDrawer;
//# sourceMappingURL=index.js.map