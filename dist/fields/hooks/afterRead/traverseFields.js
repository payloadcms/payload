"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseFields = void 0;
const promise_1 = require("./promise");
const traverseFields = ({ currentDepth, depth, doc, fieldPromises, fields, findMany, flattenLocales, overrideAccess, populationPromises, req, siblingDoc, showHiddenFields, }) => {
    fields.forEach((field) => {
        fieldPromises.push((0, promise_1.promise)({
            currentDepth,
            depth,
            doc,
            field,
            fieldPromises,
            findMany,
            flattenLocales,
            overrideAccess,
            populationPromises,
            req,
            siblingDoc,
            showHiddenFields,
        }));
    });
};
exports.traverseFields = traverseFields;
//# sourceMappingURL=traverseFields.js.map