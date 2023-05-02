"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../../../../../utilities/getTranslation");
const ArrayCell = ({ data, field }) => {
    var _a;
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const arrayFields = data !== null && data !== void 0 ? data : [];
    const label = `${arrayFields.length} ${(0, getTranslation_1.getTranslation)(((_a = field === null || field === void 0 ? void 0 : field.labels) === null || _a === void 0 ? void 0 : _a.plural) || t('rows'), i18n)}`;
    return (react_1.default.createElement("span", null, label));
};
exports.default = ArrayCell;
//# sourceMappingURL=index.js.map