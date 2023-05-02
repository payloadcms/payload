"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFilterOptions = void 0;
const react_1 = require("react");
const deep_equal_1 = __importDefault(require("deep-equal"));
const Auth_1 = require("../Auth");
const DocumentInfo_1 = require("../DocumentInfo");
const context_1 = require("../../forms/Form/context");
const getFilterOptionsQuery_1 = require("../../forms/field-types/getFilterOptionsQuery");
const reduceFieldsToValues_1 = __importDefault(require("../../forms/Form/reduceFieldsToValues"));
const getSiblingData_1 = __importDefault(require("../../forms/Form/getSiblingData"));
const GetFilterOptions = ({ filterOptions, filterOptionsResult, setFilterOptionsResult, relationTo, path, }) => {
    const [fields] = (0, context_1.useAllFormFields)();
    const { id } = (0, DocumentInfo_1.useDocumentInfo)();
    const { user } = (0, Auth_1.useAuth)();
    (0, react_1.useEffect)(() => {
        const data = (0, reduceFieldsToValues_1.default)(fields, true);
        const siblingData = (0, getSiblingData_1.default)(fields, path);
        const newFilterOptionsResult = (0, getFilterOptionsQuery_1.getFilterOptionsQuery)(filterOptions, {
            id,
            data,
            relationTo,
            siblingData,
            user,
        });
        if (!(0, deep_equal_1.default)(newFilterOptionsResult, filterOptionsResult)) {
            setFilterOptionsResult(newFilterOptionsResult);
        }
    }, [
        fields,
        filterOptions,
        id,
        relationTo,
        user,
        path,
        filterOptionsResult,
        setFilterOptionsResult,
    ]);
    return null;
};
exports.GetFilterOptions = GetFilterOptions;
//# sourceMappingURL=index.js.map