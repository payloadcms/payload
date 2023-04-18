"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.afterRead = void 0;
const traverseFields_1 = require("./traverseFields");
const deepCopyObject_1 = __importDefault(require("../../../utilities/deepCopyObject"));
async function afterRead(args) {
    const { currentDepth: incomingCurrentDepth, depth: incomingDepth, doc: incomingDoc, entityConfig, findMany, flattenLocales = true, req, overrideAccess, showHiddenFields, } = args;
    const doc = (0, deepCopyObject_1.default)(incomingDoc);
    const fieldPromises = [];
    const populationPromises = [];
    let depth = 0;
    if (req.payloadAPI === 'REST' || req.payloadAPI === 'local') {
        depth = (incomingDepth || incomingDepth === 0) ? parseInt(String(incomingDepth), 10) : req.payload.config.defaultDepth;
        if (depth > req.payload.config.maxDepth)
            depth = req.payload.config.maxDepth;
    }
    const currentDepth = incomingCurrentDepth || 1;
    (0, traverseFields_1.traverseFields)({
        currentDepth,
        depth,
        doc,
        fields: entityConfig.fields,
        fieldPromises,
        findMany,
        flattenLocales,
        overrideAccess,
        populationPromises,
        req,
        siblingDoc: doc,
        showHiddenFields,
    });
    await Promise.all(fieldPromises);
    await Promise.all(populationPromises);
    return doc;
}
exports.afterRead = afterRead;
//# sourceMappingURL=index.js.map