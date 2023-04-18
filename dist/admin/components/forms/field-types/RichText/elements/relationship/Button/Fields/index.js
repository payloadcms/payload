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
const Config_1 = require("../../../../../../../utilities/Config");
const Auth_1 = require("../../../../../../../utilities/Auth");
const context_1 = require("../../../../../../Form/context");
const Relationship_1 = __importDefault(require("../../../../../Relationship"));
const Select_1 = __importDefault(require("../../../../../Select"));
const createOptions = (collections, permissions) => collections.reduce((options, collection) => {
    var _a, _b, _c, _d;
    if (((_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[collection.slug]) === null || _b === void 0 ? void 0 : _b.read) === null || _c === void 0 ? void 0 : _c.permission) && ((_d = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _d === void 0 ? void 0 : _d.enableRichTextRelationship)) {
        return [
            ...options,
            {
                label: collection.labels.plural,
                value: collection.slug,
            },
        ];
    }
    return options;
}, []);
const RelationshipFields = () => {
    const { collections } = (0, Config_1.useConfig)();
    const { permissions } = (0, Auth_1.useAuth)();
    const { t } = (0, react_i18next_1.useTranslation)('fields');
    const [options, setOptions] = (0, react_1.useState)(() => createOptions(collections, permissions));
    const relationTo = (0, context_1.useFormFields)(([fields]) => { var _a; return (_a = fields.relationTo) === null || _a === void 0 ? void 0 : _a.value; });
    (0, react_1.useEffect)(() => {
        setOptions(createOptions(collections, permissions));
    }, [collections, permissions]);
    return (react_1.default.createElement(react_1.Fragment, null,
        react_1.default.createElement(Select_1.default, { required: true, label: t('relationTo'), name: "relationTo", options: options }),
        relationTo && (react_1.default.createElement(Relationship_1.default, { label: t('relatedDocument'), name: "value", relationTo: relationTo, required: true }))));
};
exports.default = RelationshipFields;
//# sourceMappingURL=index.js.map