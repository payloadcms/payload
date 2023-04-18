"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurseRichText = void 0;
const recurseNestedFields_1 = require("./recurseNestedFields");
const populate_1 = require("./populate");
const recurseRichText = ({ req, children, overrideAccess = false, depth, currentDepth = 0, field, promises, showHiddenFields, }) => {
    if (Array.isArray(children)) {
        children.forEach((element) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            if ((depth && currentDepth <= depth)) {
                if ((element.type === 'relationship' || element.type === 'upload')
                    && ((_a = element === null || element === void 0 ? void 0 : element.value) === null || _a === void 0 ? void 0 : _a.id)) {
                    const collection = req.payload.collections[element === null || element === void 0 ? void 0 : element.relationTo];
                    if (collection) {
                        promises.push((0, populate_1.populate)({
                            req,
                            id: element.value.id,
                            data: element,
                            key: 'value',
                            overrideAccess,
                            depth,
                            currentDepth,
                            field,
                            collection,
                            showHiddenFields,
                        }));
                    }
                    if (element.type === 'upload' && Array.isArray((_e = (_d = (_c = (_b = field.admin) === null || _b === void 0 ? void 0 : _b.upload) === null || _c === void 0 ? void 0 : _c.collections) === null || _d === void 0 ? void 0 : _d[element === null || element === void 0 ? void 0 : element.relationTo]) === null || _e === void 0 ? void 0 : _e.fields)) {
                        (0, recurseNestedFields_1.recurseNestedFields)({
                            promises,
                            data: element.fields || {},
                            fields: field.admin.upload.collections[element.relationTo].fields,
                            req,
                            overrideAccess,
                            depth,
                            currentDepth,
                            showHiddenFields,
                        });
                    }
                }
                if (element.type === 'link') {
                    if (((_f = element === null || element === void 0 ? void 0 : element.doc) === null || _f === void 0 ? void 0 : _f.value) && ((_g = element === null || element === void 0 ? void 0 : element.doc) === null || _g === void 0 ? void 0 : _g.relationTo)) {
                        const collection = req.payload.collections[(_h = element === null || element === void 0 ? void 0 : element.doc) === null || _h === void 0 ? void 0 : _h.relationTo];
                        if (collection) {
                            promises.push((0, populate_1.populate)({
                                req,
                                id: element.doc.value,
                                data: element.doc,
                                key: 'value',
                                overrideAccess,
                                depth,
                                currentDepth,
                                field,
                                collection,
                                showHiddenFields,
                            }));
                        }
                    }
                    if (Array.isArray((_k = (_j = field.admin) === null || _j === void 0 ? void 0 : _j.link) === null || _k === void 0 ? void 0 : _k.fields)) {
                        (0, recurseNestedFields_1.recurseNestedFields)({
                            promises,
                            data: element.fields || {},
                            fields: (_m = (_l = field.admin) === null || _l === void 0 ? void 0 : _l.link) === null || _m === void 0 ? void 0 : _m.fields,
                            req,
                            overrideAccess,
                            depth,
                            currentDepth,
                            showHiddenFields,
                        });
                    }
                }
            }
            if (element === null || element === void 0 ? void 0 : element.children) {
                (0, exports.recurseRichText)({
                    children: element.children,
                    currentDepth,
                    depth,
                    field,
                    overrideAccess,
                    promises,
                    req,
                    showHiddenFields,
                });
            }
        });
    }
};
exports.recurseRichText = recurseRichText;
const richTextRelationshipPromise = async ({ currentDepth, depth, field, overrideAccess, req, siblingDoc, showHiddenFields, }) => {
    const promises = [];
    (0, exports.recurseRichText)({
        children: siblingDoc[field.name],
        currentDepth,
        depth,
        field,
        overrideAccess,
        promises,
        req,
        showHiddenFields,
    });
    await Promise.all(promises);
};
exports.default = richTextRelationshipPromise;
//# sourceMappingURL=richTextRelationshipPromise.js.map