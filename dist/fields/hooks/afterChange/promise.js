"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promise = void 0;
const types_1 = require("../../config/types");
const traverseFields_1 = require("./traverseFields");
// This function is responsible for the following actions, in order:
// - Execute field hooks
const promise = async ({ data, doc, previousDoc, previousSiblingDoc, field, operation, req, siblingData, siblingDoc, }) => {
    var _a;
    if ((0, types_1.fieldAffectsData)(field)) {
        // Execute hooks
        if ((_a = field.hooks) === null || _a === void 0 ? void 0 : _a.afterChange) {
            await field.hooks.afterChange.reduce(async (priorHook, currentHook) => {
                await priorHook;
                const hookedValue = await currentHook({
                    value: siblingData[field.name],
                    originalDoc: doc,
                    previousDoc,
                    previousSiblingDoc,
                    previousValue: previousDoc[field.name],
                    data,
                    siblingData,
                    operation,
                    req,
                });
                if (hookedValue !== undefined) {
                    siblingDoc[field.name] = hookedValue;
                }
            }, Promise.resolve());
        }
    }
    // Traverse subfields
    switch (field.type) {
        case 'group': {
            await (0, traverseFields_1.traverseFields)({
                data,
                doc,
                previousDoc,
                previousSiblingDoc: previousDoc[field.name],
                fields: field.fields,
                operation,
                req,
                siblingData: (siblingData === null || siblingData === void 0 ? void 0 : siblingData[field.name]) || {},
                siblingDoc: siblingDoc[field.name],
            });
            break;
        }
        case 'array': {
            const rows = siblingDoc[field.name];
            if (Array.isArray(rows)) {
                const promises = [];
                rows.forEach((row, i) => {
                    var _a, _b;
                    promises.push((0, traverseFields_1.traverseFields)({
                        data,
                        doc,
                        previousDoc,
                        previousSiblingDoc: ((_a = previousDoc === null || previousDoc === void 0 ? void 0 : previousDoc[field.name]) === null || _a === void 0 ? void 0 : _a[i]) || {},
                        fields: field.fields,
                        operation,
                        req,
                        siblingData: ((_b = siblingData === null || siblingData === void 0 ? void 0 : siblingData[field.name]) === null || _b === void 0 ? void 0 : _b[i]) || {},
                        siblingDoc: { ...row } || {},
                    }));
                });
                await Promise.all(promises);
            }
            break;
        }
        case 'blocks': {
            const rows = siblingDoc[field.name];
            if (Array.isArray(rows)) {
                const promises = [];
                rows.forEach((row, i) => {
                    var _a, _b;
                    const block = field.blocks.find((blockType) => blockType.slug === row.blockType);
                    if (block) {
                        promises.push((0, traverseFields_1.traverseFields)({
                            data,
                            doc,
                            previousDoc,
                            previousSiblingDoc: ((_a = previousDoc === null || previousDoc === void 0 ? void 0 : previousDoc[field.name]) === null || _a === void 0 ? void 0 : _a[i]) || {},
                            fields: block.fields,
                            operation,
                            req,
                            siblingData: ((_b = siblingData === null || siblingData === void 0 ? void 0 : siblingData[field.name]) === null || _b === void 0 ? void 0 : _b[i]) || {},
                            siblingDoc: { ...row } || {},
                        }));
                    }
                });
                await Promise.all(promises);
            }
            break;
        }
        case 'row':
        case 'collapsible': {
            await (0, traverseFields_1.traverseFields)({
                data,
                doc,
                previousDoc,
                previousSiblingDoc: { ...previousSiblingDoc },
                fields: field.fields,
                operation,
                req,
                siblingData: siblingData || {},
                siblingDoc: { ...siblingDoc },
            });
            break;
        }
        case 'tab': {
            let tabSiblingData = siblingData;
            let tabSiblingDoc = siblingDoc;
            let tabPreviousSiblingDoc = siblingDoc;
            if ((0, types_1.tabHasName)(field)) {
                tabSiblingData = siblingData[field.name];
                tabSiblingDoc = siblingDoc[field.name];
                tabPreviousSiblingDoc = previousDoc[field.name];
            }
            await (0, traverseFields_1.traverseFields)({
                data,
                doc,
                fields: field.fields,
                operation,
                req,
                previousSiblingDoc: tabPreviousSiblingDoc,
                previousDoc,
                siblingData: tabSiblingData,
                siblingDoc: tabSiblingDoc,
            });
            break;
        }
        case 'tabs': {
            await (0, traverseFields_1.traverseFields)({
                data,
                doc,
                previousDoc,
                previousSiblingDoc: { ...previousSiblingDoc },
                fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
                operation,
                req,
                siblingData: siblingData || {},
                siblingDoc: { ...siblingDoc },
            });
            break;
        }
        default: {
            break;
        }
    }
};
exports.promise = promise;
//# sourceMappingURL=promise.js.map