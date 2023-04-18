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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnabledRelationshipsCondition = void 0;
const React = __importStar(require("react"));
const Config_1 = require("../../../../utilities/Config");
const filterRichTextCollections = (collections, options) => {
    return collections.filter(({ admin: { enableRichTextRelationship }, upload }) => {
        if (options === null || options === void 0 ? void 0 : options.uploads) {
            return enableRichTextRelationship && Boolean(upload) === true;
        }
        return upload ? false : enableRichTextRelationship;
    });
};
const EnabledRelationshipsCondition = (props) => {
    const { children, uploads = false, ...rest } = props;
    const { collections } = (0, Config_1.useConfig)();
    const [enabledCollectionSlugs] = React.useState(() => filterRichTextCollections(collections, { uploads }).map(({ slug }) => slug));
    if (!enabledCollectionSlugs.length) {
        return null;
    }
    return React.cloneElement(children, { ...rest, enabledCollectionSlugs });
};
exports.EnabledRelationshipsCondition = EnabledRelationshipsCondition;
//# sourceMappingURL=EnabledRelationshipsCondition.js.map