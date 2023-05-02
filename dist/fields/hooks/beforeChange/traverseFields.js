"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseFields = void 0;
const promise_1 = require("./promise");
const traverseFields = async ({ data, doc, docWithLocales, errors, fields, id, mergeLocaleActions, operation, path, req, siblingData, siblingDoc, siblingDocWithLocales, skipValidation, }) => {
    const promises = [];
    fields.forEach((field) => {
        promises.push((0, promise_1.promise)({
            data,
            doc,
            docWithLocales,
            errors,
            field,
            id,
            mergeLocaleActions,
            operation,
            path,
            req,
            siblingData,
            siblingDoc,
            siblingDocWithLocales,
            skipValidation,
        }));
    });
    await Promise.all(promises);
};
exports.traverseFields = traverseFields;
//# sourceMappingURL=traverseFields.js.map