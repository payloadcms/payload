"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurseNestedFields = void 0;
/* eslint-disable @typescript-eslint/no-use-before-define */
const types_1 = require("../config/types");
const populate_1 = require("./populate");
const richTextRelationshipPromise_1 = require("./richTextRelationshipPromise");
const recurseNestedFields = ({ promises, data, fields, req, overrideAccess = false, depth, currentDepth = 0, showHiddenFields, }) => {
    fields.forEach((field) => {
        var _a, _b;
        if (field.type === 'relationship' || field.type === 'upload') {
            if (field.type === 'relationship') {
                if (field.hasMany && Array.isArray(data[field.name])) {
                    if (Array.isArray(field.relationTo)) {
                        data[field.name].forEach(({ relationTo, value }, i) => {
                            const collection = req.payload.collections[relationTo];
                            if (collection) {
                                promises.push((0, populate_1.populate)({
                                    id: value,
                                    field,
                                    collection,
                                    data: data[field.name],
                                    key: i,
                                    overrideAccess,
                                    depth,
                                    currentDepth,
                                    req,
                                    showHiddenFields,
                                }));
                            }
                        });
                    }
                    else {
                        data[field.name].forEach((id, i) => {
                            const collection = req.payload.collections[field.relationTo];
                            if (collection) {
                                promises.push((0, populate_1.populate)({
                                    id,
                                    field,
                                    collection,
                                    data: data[field.name],
                                    key: i,
                                    overrideAccess,
                                    depth,
                                    currentDepth,
                                    req,
                                    showHiddenFields,
                                }));
                            }
                        });
                    }
                }
                else if (Array.isArray(field.relationTo) && ((_a = data[field.name]) === null || _a === void 0 ? void 0 : _a.value) && ((_b = data[field.name]) === null || _b === void 0 ? void 0 : _b.relationTo)) {
                    const collection = req.payload.collections[data[field.name].relationTo];
                    promises.push((0, populate_1.populate)({
                        id: data[field.name].value,
                        field,
                        collection,
                        data: data[field.name],
                        key: 'value',
                        overrideAccess,
                        depth,
                        currentDepth,
                        req,
                        showHiddenFields,
                    }));
                }
            }
            if (typeof data[field.name] !== 'undefined' && typeof field.relationTo === 'string') {
                const collection = req.payload.collections[field.relationTo];
                promises.push((0, populate_1.populate)({
                    id: data[field.name],
                    field,
                    collection,
                    data,
                    key: field.name,
                    overrideAccess,
                    depth,
                    currentDepth,
                    req,
                    showHiddenFields,
                }));
            }
        }
        else if ((0, types_1.fieldHasSubFields)(field) && !(0, types_1.fieldIsArrayType)(field)) {
            if ((0, types_1.fieldAffectsData)(field) && typeof data[field.name] === 'object') {
                (0, exports.recurseNestedFields)({
                    promises,
                    data: data[field.name],
                    fields: field.fields,
                    req,
                    overrideAccess,
                    depth,
                    currentDepth,
                    showHiddenFields,
                });
            }
            else {
                (0, exports.recurseNestedFields)({
                    promises,
                    data,
                    fields: field.fields,
                    req,
                    overrideAccess,
                    depth,
                    currentDepth,
                    showHiddenFields,
                });
            }
        }
        else if (field.type === 'tabs') {
            field.tabs.forEach((tab) => {
                (0, exports.recurseNestedFields)({
                    promises,
                    data,
                    fields: tab.fields,
                    req,
                    overrideAccess,
                    depth,
                    currentDepth,
                    showHiddenFields,
                });
            });
        }
        else if (Array.isArray(data[field.name])) {
            if (field.type === 'blocks') {
                data[field.name].forEach((row, i) => {
                    const block = field.blocks.find(({ slug }) => slug === (row === null || row === void 0 ? void 0 : row.blockType));
                    if (block) {
                        (0, exports.recurseNestedFields)({
                            promises,
                            data: data[field.name][i],
                            fields: block.fields,
                            req,
                            overrideAccess,
                            depth,
                            currentDepth,
                            showHiddenFields,
                        });
                    }
                });
            }
            if (field.type === 'array') {
                data[field.name].forEach((_, i) => {
                    (0, exports.recurseNestedFields)({
                        promises,
                        data: data[field.name][i],
                        fields: field.fields,
                        req,
                        overrideAccess,
                        depth,
                        currentDepth,
                        showHiddenFields,
                    });
                });
            }
        }
        if (field.type === 'richText' && Array.isArray(data[field.name])) {
            data[field.name].forEach((node) => {
                if (Array.isArray(node.children)) {
                    (0, richTextRelationshipPromise_1.recurseRichText)({
                        req,
                        children: node.children,
                        overrideAccess,
                        depth,
                        currentDepth,
                        field,
                        promises,
                        showHiddenFields,
                    });
                }
            });
        }
    });
};
exports.recurseNestedFields = recurseNestedFields;
//# sourceMappingURL=recurseNestedFields.js.map