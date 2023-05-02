"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDrawer = void 0;
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Drawer_1 = require("../../../../../../elements/Drawer");
const Form_1 = __importDefault(require("../../../../../Form"));
const Submit_1 = __importDefault(require("../../../../../Submit"));
const __1 = __importDefault(require("../../../.."));
const RenderFields_1 = __importDefault(require("../../../../../RenderFields"));
require("./index.scss");
const baseClass = 'rich-text-link-edit-modal';
const LinkDrawer = ({ handleModalSubmit, initialState, fieldSchema, drawerSlug, }) => {
    const { t } = (0, react_i18next_1.useTranslation)('fields');
    return (react_1.default.createElement(Drawer_1.Drawer, { slug: drawerSlug, className: baseClass, title: t('editLink') },
        react_1.default.createElement(Form_1.default, { onSubmit: handleModalSubmit, initialState: initialState },
            react_1.default.createElement(RenderFields_1.default, { fieldTypes: __1.default, readOnly: false, fieldSchema: fieldSchema, forceRender: true }),
            react_1.default.createElement(Submit_1.default, null, t('general:submit')))));
};
exports.LinkDrawer = LinkDrawer;
//# sourceMappingURL=index.js.map