"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Button_1 = __importDefault(require("../Button"));
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
require("./index.scss");
const baseClass = 'versions-count';
const VersionsCount = ({ collection, global, id }) => {
    const { routes: { admin } } = (0, Config_1.useConfig)();
    const { versions } = (0, DocumentInfo_1.useDocumentInfo)();
    const { t } = (0, react_i18next_1.useTranslation)('version');
    let versionsURL;
    if (collection) {
        versionsURL = `${admin}/collections/${collection.slug}/${id}/versions`;
    }
    if (global) {
        versionsURL = `${admin}/globals/${global.slug}/versions`;
    }
    const versionCount = (versions === null || versions === void 0 ? void 0 : versions.totalDocs) || 0;
    return (react_1.default.createElement("div", { className: baseClass },
        versionCount === 0 && t('versionCount_none'),
        versionCount > 0 && (react_1.default.createElement(Button_1.default, { className: `${baseClass}__button`, buttonStyle: "none", el: "link", to: versionsURL }, t(versionCount === 1 ? 'versionCount_one' : 'versionCount_many', { count: versionCount })))));
};
exports.default = VersionsCount;
//# sourceMappingURL=index.js.map