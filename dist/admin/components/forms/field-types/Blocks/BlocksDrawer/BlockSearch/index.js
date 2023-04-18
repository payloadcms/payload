"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Search_1 = __importDefault(require("../../../../../graphics/Search"));
require("./index.scss");
const baseClass = 'block-search';
const BlockSearch = (props) => {
    const { setSearchTerm } = props;
    const { t } = (0, react_i18next_1.useTranslation)('fields');
    const handleChange = (e) => {
        setSearchTerm(e.target.value);
    };
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("input", { className: `${baseClass}__input`, placeholder: t('searchForBlock'), onChange: handleChange }),
        react_1.default.createElement(Search_1.default, null)));
};
exports.default = BlockSearch;
//# sourceMappingURL=index.js.map