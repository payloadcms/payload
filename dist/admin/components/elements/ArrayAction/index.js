"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayAction = void 0;
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Popup_1 = __importDefault(require("../Popup"));
const More_1 = __importDefault(require("../../icons/More"));
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const Plus_1 = __importDefault(require("../../icons/Plus"));
const X_1 = __importDefault(require("../../icons/X"));
const Copy_1 = __importDefault(require("../../icons/Copy"));
require("./index.scss");
const baseClass = 'array-actions';
const ArrayAction = ({ moveRow, index, rowCount, addRow, duplicateRow, removeRow, }) => {
    const { t } = (0, react_i18next_1.useTranslation)('general');
    return (react_1.default.createElement(Popup_1.default, { horizontalAlign: "center", className: baseClass, buttonClassName: `${baseClass}__button`, button: react_1.default.createElement(More_1.default, null), render: ({ close }) => {
            return (react_1.default.createElement(react_1.default.Fragment, null,
                index !== 0 && (react_1.default.createElement("button", { className: `${baseClass}__action ${baseClass}__move-up`, type: "button", onClick: () => {
                        moveRow(index, index - 1);
                        close();
                    } },
                    react_1.default.createElement(Chevron_1.default, null),
                    t('moveUp'))),
                index < rowCount - 1 && (react_1.default.createElement("button", { className: `${baseClass}__action ${baseClass}__move-down`, type: "button", onClick: () => {
                        moveRow(index, index + 1);
                        close();
                    } },
                    react_1.default.createElement(Chevron_1.default, null),
                    t('moveDown'))),
                react_1.default.createElement("button", { className: `${baseClass}__action ${baseClass}__add`, type: "button", onClick: () => {
                        addRow(index);
                        close();
                    } },
                    react_1.default.createElement(Plus_1.default, null),
                    t('addBelow')),
                react_1.default.createElement("button", { className: `${baseClass}__action ${baseClass}__duplicate`, type: "button", onClick: () => {
                        duplicateRow(index);
                        close();
                    } },
                    react_1.default.createElement(Copy_1.default, null),
                    t('duplicate')),
                react_1.default.createElement("button", { className: `${baseClass}__action ${baseClass}__remove`, type: "button", onClick: () => {
                        removeRow(index);
                        close();
                    } },
                    react_1.default.createElement(X_1.default, null),
                    t('remove'))));
        } }));
};
exports.ArrayAction = ArrayAction;
//# sourceMappingURL=index.js.map