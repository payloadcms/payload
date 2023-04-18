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
const Submit_1 = __importDefault(require("../../forms/Submit"));
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const context_1 = require("../../forms/Form/context");
const Publish = () => {
    const { unpublishedVersions, publishedDoc } = (0, DocumentInfo_1.useDocumentInfo)();
    const { submit } = (0, context_1.useForm)();
    const modified = (0, context_1.useFormModified)();
    const { t } = (0, react_i18next_1.useTranslation)('version');
    const hasNewerVersions = (unpublishedVersions === null || unpublishedVersions === void 0 ? void 0 : unpublishedVersions.totalDocs) > 0;
    const canPublish = modified || hasNewerVersions || !publishedDoc;
    const publish = (0, react_1.useCallback)(() => {
        submit({
            overrides: {
                _status: 'published',
            },
        });
    }, [submit]);
    return (react_1.default.createElement(Submit_1.default, { type: "button", onClick: publish, disabled: !canPublish }, t('publishChanges')));
};
exports.default = Publish;
//# sourceMappingURL=index.js.map