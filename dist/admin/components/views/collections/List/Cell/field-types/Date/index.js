"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../../../../utilities/Config");
const formatDate_1 = require("../../../../../../../utilities/formatDate");
const DateCell = ({ data, field }) => {
    var _a, _b;
    const { admin: { dateFormat: dateFormatFromConfig } } = (0, Config_1.useConfig)();
    const dateFormat = ((_b = (_a = field === null || field === void 0 ? void 0 : field.admin) === null || _a === void 0 ? void 0 : _a.date) === null || _b === void 0 ? void 0 : _b.displayFormat) || dateFormatFromConfig;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    return (react_1.default.createElement("span", null, data && (0, formatDate_1.formatDate)(data, dateFormat, i18n === null || i18n === void 0 ? void 0 : i18n.language)));
};
exports.default = DateCell;
//# sourceMappingURL=index.js.map