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
const react_1 = __importDefault(require("react"));
const react_diff_viewer_1 = __importStar(require("react-diff-viewer"));
const react_i18next_1 = require("react-i18next");
const Label_1 = __importDefault(require("../../Label"));
const styles_1 = require("../styles");
const getTranslation_1 = require("../../../../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'text-diff';
const Text = ({ field, locale, version, comparison, isRichText = false, diffMethod }) => {
    let placeholder = '';
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    if (version === comparison)
        placeholder = `[${t('noValue')}]`;
    let versionToRender = version;
    let comparisonToRender = comparison;
    if (isRichText) {
        if (typeof version === 'object')
            versionToRender = JSON.stringify(version, null, 2);
        if (typeof comparison === 'object')
            comparisonToRender = JSON.stringify(comparison, null, 2);
    }
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Label_1.default, null,
            locale && (react_1.default.createElement("span", { className: `${baseClass}__locale-label` }, locale)),
            (0, getTranslation_1.getTranslation)(field.label, i18n)),
        react_1.default.createElement(react_diff_viewer_1.default, { styles: styles_1.diffStyles, compareMethod: react_diff_viewer_1.DiffMethod[diffMethod], oldValue: typeof comparisonToRender !== 'undefined' ? String(comparisonToRender) : placeholder, newValue: typeof versionToRender !== 'undefined' ? String(versionToRender) : placeholder, splitView: true, hideLineNumbers: true, showDiffOnly: false })));
};
exports.default = Text;
//# sourceMappingURL=index.js.map