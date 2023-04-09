"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promise = void 0;
/* eslint-disable no-param-reassign */
const types_1 = require("../../config/types");
const traverseFields_1 = require("./traverseFields");
const richTextRelationshipPromise_1 = __importDefault(require("../../richText/richTextRelationshipPromise"));
const relationshipPopulationPromise_1 = __importDefault(require("./relationshipPopulationPromise"));
// This function is responsible for the following actions, in order:
// - Remove hidden fields from response
// - Flatten locales into requested locale
// - Sanitize outgoing data (point field, etc)
// - Execute field hooks
// - Execute read access control
// - Populate relationships
const promise = async ({ currentDepth, depth, doc, field, fieldPromises, findMany, flattenLocales, overrideAccess, populationPromises, req, siblingDoc, showHiddenFields, }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if ((0, types_1.fieldAffectsData)(field) && field.hidden && typeof siblingDoc[field.name] !== 'undefined' && !showHiddenFields) {
        delete siblingDoc[field.name];
    }
    const shouldHoistLocalizedValue = flattenLocales
        && (0, types_1.fieldAffectsData)(field)
        && (typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null)
        && field.localized
        && req.locale !== 'all'
        && req.payload.config.localization;
    if (shouldHoistLocalizedValue) {
        // replace actual value with localized value before sanitizing
        // { [locale]: fields } -> fields
        const { locale } = req;
        const value = siblingDoc[field.name][locale];
        const fallbackLocale = req.payload.config.localization && ((_a = req.payload.config.localization) === null || _a === void 0 ? void 0 : _a.fallback) && req.fallbackLocale;
        let hoistedValue = value;
        if (fallbackLocale && fallbackLocale !== locale) {
            const fallbackValue = siblingDoc[field.name][fallbackLocale];
            const isNullOrUndefined = typeof value === 'undefined' || value === null;
            if (fallbackValue) {
                switch (field.type) {
                    case 'text':
                    case 'textarea': {
                        if (value === '' || isNullOrUndefined) {
                            hoistedValue = fallbackValue;
                        }
                        break;
                    }
                    default: {
                        if (isNullOrUndefined) {
                            hoistedValue = fallbackValue;
                        }
                        break;
                    }
                }
            }
        }
        siblingDoc[field.name] = hoistedValue;
    }
    // Sanitize outgoing field value
    switch (field.type) {
        case 'group': {
            // Fill groups with empty objects so fields with hooks within groups can populate
            // themselves virtually as necessary
            if (typeof siblingDoc[field.name] === 'undefined') {
                siblingDoc[field.name] = {};
            }
            break;
        }
        case 'tabs': {
            field.tabs.forEach((tab) => {
                if ((0, types_1.tabHasName)(tab) && (typeof siblingDoc[tab.name] === 'undefined' || siblingDoc[tab.name] === null)) {
                    siblingDoc[tab.name] = {};
                }
            });
            break;
        }
        case 'richText': {
            if (((((_c = (_b = field.admin) === null || _b === void 0 ? void 0 : _b.elements) === null || _c === void 0 ? void 0 : _c.includes('relationship')) || ((_e = (_d = field.admin) === null || _d === void 0 ? void 0 : _d.elements) === null || _e === void 0 ? void 0 : _e.includes('upload')) || ((_g = (_f = field.admin) === null || _f === void 0 ? void 0 : _f.elements) === null || _g === void 0 ? void 0 : _g.includes('link'))) || !((_h = field === null || field === void 0 ? void 0 : field.admin) === null || _h === void 0 ? void 0 : _h.elements))) {
                populationPromises.push((0, richTextRelationshipPromise_1.default)({
                    currentDepth,
                    depth,
                    field,
                    overrideAccess,
                    req,
                    siblingDoc,
                    showHiddenFields,
                }));
            }
            break;
        }
        case 'point': {
            const pointDoc = siblingDoc[field.name];
            if (Array.isArray(pointDoc === null || pointDoc === void 0 ? void 0 : pointDoc.coordinates) && pointDoc.coordinates.length === 2) {
                siblingDoc[field.name] = pointDoc.coordinates;
            }
            else {
                siblingDoc[field.name] = undefined;
            }
            break;
        }
        default: {
            break;
        }
    }
    if ((0, types_1.fieldAffectsData)(field)) {
        // Execute hooks
        if ((_j = field.hooks) === null || _j === void 0 ? void 0 : _j.afterRead) {
            await field.hooks.afterRead.reduce(async (priorHook, currentHook) => {
                await priorHook;
                const shouldRunHookOnAllLocales = field.localized
                    && (req.locale === 'all' || !flattenLocales)
                    && typeof siblingDoc[field.name] === 'object';
                if (shouldRunHookOnAllLocales) {
                    const hookPromises = Object.entries(siblingDoc[field.name]).map(([locale, value]) => (async () => {
                        const hookedValue = await currentHook({
                            value,
                            originalDoc: doc,
                            data: doc,
                            siblingData: siblingDoc,
                            operation: 'read',
                            req,
                        });
                        if (hookedValue !== undefined) {
                            siblingDoc[field.name][locale] = hookedValue;
                        }
                    })());
                    await Promise.all(hookPromises);
                }
                else {
                    const hookedValue = await currentHook({
                        data: doc,
                        findMany,
                        originalDoc: doc,
                        operation: 'read',
                        siblingData: siblingDoc,
                        req,
                        value: siblingDoc[field.name],
                    });
                    if (hookedValue !== undefined) {
                        siblingDoc[field.name] = hookedValue;
                    }
                }
            }, Promise.resolve());
        }
        // Execute access control
        if (field.access && field.access.read) {
            const result = overrideAccess ? true : await field.access.read({ req, id: doc.id, siblingData: siblingDoc, data: doc, doc });
            if (!result) {
                delete siblingDoc[field.name];
            }
        }
        if (field.type === 'relationship' || field.type === 'upload') {
            populationPromises.push((0, relationshipPopulationPromise_1.default)({
                currentDepth,
                depth,
                field,
                overrideAccess,
                req,
                showHiddenFields,
                siblingDoc,
            }));
        }
    }
    switch (field.type) {
        case 'group': {
            let groupDoc = siblingDoc[field.name];
            if (typeof siblingDoc[field.name] !== 'object')
                groupDoc = {};
            (0, traverseFields_1.traverseFields)({
                currentDepth,
                depth,
                doc,
                fieldPromises,
                fields: field.fields,
                findMany,
                flattenLocales,
                overrideAccess,
                populationPromises,
                req,
                siblingDoc: groupDoc,
                showHiddenFields,
            });
            break;
        }
        case 'array': {
            const rows = siblingDoc[field.name];
            if (Array.isArray(rows)) {
                rows.forEach((row) => {
                    (0, traverseFields_1.traverseFields)({
                        currentDepth,
                        depth,
                        doc,
                        fields: field.fields,
                        fieldPromises,
                        findMany,
                        flattenLocales,
                        overrideAccess,
                        populationPromises,
                        req,
                        siblingDoc: row || {},
                        showHiddenFields,
                    });
                });
            }
            break;
        }
        case 'blocks': {
            const rows = siblingDoc[field.name];
            if (Array.isArray(rows)) {
                rows.forEach((row) => {
                    const block = field.blocks.find((blockType) => blockType.slug === row.blockType);
                    if (block) {
                        (0, traverseFields_1.traverseFields)({
                            currentDepth,
                            depth,
                            doc,
                            fields: block.fields,
                            fieldPromises,
                            findMany,
                            flattenLocales,
                            overrideAccess,
                            populationPromises,
                            req,
                            siblingDoc: row || {},
                            showHiddenFields,
                        });
                    }
                });
            }
            break;
        }
        case 'row':
        case 'collapsible': {
            (0, traverseFields_1.traverseFields)({
                currentDepth,
                depth,
                doc,
                fieldPromises,
                fields: field.fields,
                findMany,
                flattenLocales,
                overrideAccess,
                populationPromises,
                req,
                siblingDoc,
                showHiddenFields,
            });
            break;
        }
        case 'tab': {
            let tabDoc = siblingDoc;
            if ((0, types_1.tabHasName)(field)) {
                tabDoc = siblingDoc[field.name];
                if (typeof siblingDoc[field.name] !== 'object')
                    tabDoc = {};
            }
            await (0, traverseFields_1.traverseFields)({
                currentDepth,
                depth,
                doc,
                fieldPromises,
                fields: field.fields,
                findMany,
                flattenLocales,
                overrideAccess,
                populationPromises,
                req,
                siblingDoc: tabDoc,
                showHiddenFields,
            });
            break;
        }
        case 'tabs': {
            (0, traverseFields_1.traverseFields)({
                currentDepth,
                depth,
                doc,
                fieldPromises,
                fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
                findMany,
                flattenLocales,
                overrideAccess,
                populationPromises,
                req,
                siblingDoc,
                showHiddenFields,
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