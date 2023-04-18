"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseFields = void 0;
const promise_1 = require("./promise");
const traverseFields = async ({ data, doc, fields, id, operation, overrideAccess, req, siblingData, siblingDoc, }) => {
    const promises = [];
    fields.forEach((field) => {
        promises.push((0, promise_1.promise)({
            data,
            doc,
            field,
            id,
            operation,
            overrideAccess,
            req,
            siblingData,
            siblingDoc,
        }));
    });
    await Promise.all(promises);
};
exports.traverseFields = traverseFields;
//# sourceMappingURL=traverseFields.js.map