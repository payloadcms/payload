"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeValidate = void 0;
const traverseFields_1 = require("./traverseFields");
const deepCopyObject_1 = __importDefault(require("../../../utilities/deepCopyObject"));
const beforeValidate = async ({ data: incomingData, doc, entityConfig, id, operation, overrideAccess, req, }) => {
    const data = (0, deepCopyObject_1.default)(incomingData);
    await (0, traverseFields_1.traverseFields)({
        data,
        doc,
        fields: entityConfig.fields,
        id,
        operation,
        overrideAccess,
        req,
        siblingData: data,
        siblingDoc: doc,
    });
    return data;
};
exports.beforeValidate = beforeValidate;
//# sourceMappingURL=index.js.map