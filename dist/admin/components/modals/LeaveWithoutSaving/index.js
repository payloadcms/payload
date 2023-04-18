"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_navigation_prompt_1 = __importDefault(require("react-router-navigation-prompt"));
const react_i18next_1 = require("react-i18next");
const Auth_1 = require("../../utilities/Auth");
const context_1 = require("../../forms/Form/context");
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const Button_1 = __importDefault(require("../../elements/Button"));
require("./index.scss");
const modalSlug = 'leave-without-saving';
const LeaveWithoutSaving = () => {
    const modified = (0, context_1.useFormModified)();
    const { user } = (0, Auth_1.useAuth)();
    const { t } = (0, react_i18next_1.useTranslation)('general');
    return (react_1.default.createElement(react_router_navigation_prompt_1.default, { when: Boolean(modified && user) }, ({ onConfirm, onCancel }) => (react_1.default.createElement("div", { className: modalSlug },
        react_1.default.createElement(Minimal_1.default, { className: `${modalSlug}__template` },
            react_1.default.createElement("h1", null, t('leaveWithoutSaving')),
            react_1.default.createElement("p", null, t('changesNotSaved')),
            react_1.default.createElement(Button_1.default, { onClick: onCancel, buttonStyle: "secondary" }, t('stayOnThisPage')),
            react_1.default.createElement(Button_1.default, { onClick: onConfirm }, t('leaveAnyway')))))));
};
exports.default = LeaveWithoutSaving;
//# sourceMappingURL=index.js.map