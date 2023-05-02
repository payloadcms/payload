"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.afterChange = void 0;
const traverseFields_1 = require("./traverseFields");
const deepCopyObject_1 = __importDefault(require("../../../utilities/deepCopyObject"));
const afterChange = async ({ data, doc: incomingDoc, previousDoc, entityConfig, operation, req, }) => {
    const doc = (0, deepCopyObject_1.default)(incomingDoc);
    await (0, traverseFields_1.traverseFields)({
        data,
        doc,
        previousDoc,
        fields: entityConfig.fields,
        operation,
        req,
        previousSiblingDoc: previousDoc,
        siblingDoc: doc,
        siblingData: data,
    });
    return doc;
};
exports.afterChange = afterChange;
//# sourceMappingURL=index.js.map