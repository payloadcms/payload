"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeChange = void 0;
const traverseFields_1 = require("./traverseFields");
const errors_1 = require("../../../errors");
const deepCopyObject_1 = __importDefault(require("../../../utilities/deepCopyObject"));
const beforeChange = async ({ data: incomingData, doc, docWithLocales, entityConfig, id, operation, req, skipValidation, }) => {
    const data = (0, deepCopyObject_1.default)(incomingData);
    const mergeLocaleActions = [];
    const errors = [];
    await (0, traverseFields_1.traverseFields)({
        data,
        doc,
        docWithLocales,
        errors,
        id,
        operation,
        path: '',
        mergeLocaleActions,
        req,
        siblingData: data,
        siblingDoc: doc,
        siblingDocWithLocales: docWithLocales,
        fields: entityConfig.fields,
        skipValidation,
    });
    if (errors.length > 0) {
        throw new errors_1.ValidationError(errors, req.t);
    }
    mergeLocaleActions.forEach((action) => action());
    return data;
};
exports.beforeChange = beforeChange;
//# sourceMappingURL=index.js.map