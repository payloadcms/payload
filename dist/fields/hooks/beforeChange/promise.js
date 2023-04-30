"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promise = void 0;
/* eslint-disable no-param-reassign */
const deepmerge_1 = __importDefault(require("deepmerge"));
const types_1 = require("../../config/types");
const getDefaultValue_1 = __importDefault(require("../../getDefaultValue"));
const traverseFields_1 = require("./traverseFields");
const getExistingRowDoc_1 = require("./getExistingRowDoc");
const cloneDataFromOriginalDoc_1 = require("./cloneDataFromOriginalDoc");
// This function is responsible for the following actions, in order:
// - Run condition
// - Merge original document data into incoming data
// - Compute default values for undefined fields
// - Execute field hooks
// - Validate data
// - Transform data for storage
// - Unflatten locales
const promise = async ({ data, doc, docWithLocales, errors, field, id, mergeLocaleActions, operation, path, req, siblingData, siblingDoc, siblingDocWithLocales, skipValidation, }) => {
    var _a, _b, _c, _d;
    const passesCondition = ((_a = field.admin) === null || _a === void 0 ? void 0 : _a.condition) ? field.admin.condition(data, siblingData, { user: req.user }) : true;
    let skipValidationFromHere = skipValidation || !passesCondition;
    const defaultLocale = ((_b = req.payload.config) === null || _b === void 0 ? void 0 : _b.localization) ? (_c = req.payload.config.localization) === null || _c === void 0 ? void 0 : _c.defaultLocale : 'en';
    const operationLocale = req.locale || defaultLocale;
    if ((0, types_1.fieldAffectsData)(field)) {
        if (typeof siblingData[field.name] === 'undefined') {
            // If no incoming data, but existing document data is found, merge it in
            if (typeof siblingDoc[field.name] !== 'undefined') {
                if (field.localized && typeof siblingDocWithLocales[field.name] === 'object' && siblingDocWithLocales[field.name] !== null) {
                    siblingData[field.name] = (0, cloneDataFromOriginalDoc_1.cloneDataFromOriginalDoc)(siblingDocWithLocales[field.name][req.locale]);
                }
                else {
                    siblingData[field.name] = (0, cloneDataFromOriginalDoc_1.cloneDataFromOriginalDoc)(siblingDoc[field.name]);
                }
                // Otherwise compute default value
            }
            else if (typeof field.defaultValue !== 'undefined') {
                siblingData[field.name] = await (0, getDefaultValue_1.default)({
                    value: siblingData[field.name],
                    defaultValue: field.defaultValue,
                    locale: req.locale,
                    user: req.user,
                });
            }
        }
        // skip validation if the field is localized and the incoming data is null
        if (field.localized && operationLocale !== defaultLocale) {
            if (['array', 'blocks'].includes(field.type) && siblingData[field.name] === null) {
                skipValidationFromHere = true;
            }
        }
        // Execute hooks
        if ((_d = field.hooks) === null || _d === void 0 ? void 0 : _d.beforeChange) {
            await field.hooks.beforeChange.reduce(async (priorHook, currentHook) => {
                await priorHook;
                const hookedValue = await currentHook({
                    value: siblingData[field.name],
                    originalDoc: doc,
                    data,
                    siblingData,
                    operation,
                    req,
                });
                if (hookedValue !== undefined) {
                    siblingData[field.name] = hookedValue;
                }
            }, Promise.resolve());
        }
        // Validate
        if (!skipValidationFromHere && field.validate) {
            let valueToValidate = siblingData[field.name];
            let jsonError;
            if (['array', 'blocks'].includes(field.type)) {
                const rows = siblingData[field.name];
                valueToValidate = Array.isArray(rows) ? rows.length : 0;
            }
            if (field.type === 'json' && typeof siblingData[field.name] === 'string') {
                try {
                    JSON.parse(siblingData[field.name]);
                }
                catch (e) {
                    jsonError = e;
                }
            }
            const validationResult = await field.validate(valueToValidate, {
                ...field,
                jsonError,
                data: (0, deepmerge_1.default)(doc, data, { arrayMerge: (_, source) => source }),
                siblingData: (0, deepmerge_1.default)(siblingDoc, siblingData, { arrayMerge: (_, source) => source }),
                id,
                operation,
                user: req.user,
                payload: req.payload,
                t: req.t,
            });
            if (typeof validationResult === 'string') {
                errors.push({
                    message: validationResult,
                    field: `${path}${field.name}`,
                });
            }
        }
        // Push merge locale action if applicable
        if (field.localized) {
            mergeLocaleActions.push(() => {
                if (req.payload.config.localization) {
                    const localeData = req.payload.config.localization.locales.reduce((localizedValues, locale) => {
                        var _a;
                        const fieldValue = locale === req.locale
                            ? siblingData[field.name]
                            : (_a = siblingDocWithLocales === null || siblingDocWithLocales === void 0 ? void 0 : siblingDocWithLocales[field.name]) === null || _a === void 0 ? void 0 : _a[locale];
                        // update locale value if it's not undefined
                        if (typeof fieldValue !== 'undefined') {
                            return {
                                ...localizedValues,
                                [locale]: fieldValue,
                            };
                        }
                        return localizedValues;
                    }, {});
                    // If there are locales with data, set the data
                    if (Object.keys(localeData).length > 0) {
                        siblingData[field.name] = localeData;
                    }
                }
            });
        }
    }
    switch (field.type) {
        case 'point': {
            // Transform point data for storage
            if (Array.isArray(siblingData[field.name]) && siblingData[field.name][0] !== null && siblingData[field.name][1] !== null) {
                siblingData[field.name] = {
                    type: 'Point',
                    coordinates: [
                        parseFloat(siblingData[field.name][0]),
                        parseFloat(siblingData[field.name][1]),
                    ],
                };
            }
            break;
        }
        case 'group': {
            if (typeof siblingData[field.name] !== 'object')
                siblingData[field.name] = {};
            if (typeof siblingDoc[field.name] !== 'object')
                siblingDoc[field.name] = {};
            if (typeof siblingDocWithLocales[field.name] !== 'object')
                siblingDocWithLocales[field.name] = {};
            await (0, traverseFields_1.traverseFields)({
                data,
                doc,
                docWithLocales,
                errors,
                fields: field.fields,
                id,
                mergeLocaleActions,
                operation,
                path: `${path}${field.name}.`,
                req,
                siblingData: siblingData[field.name],
                siblingDoc: siblingDoc[field.name],
                siblingDocWithLocales: siblingDocWithLocales[field.name],
                skipValidation: skipValidationFromHere,
            });
            break;
        }
        case 'array': {
            const rows = siblingData[field.name];
            if (Array.isArray(rows)) {
                const promises = [];
                rows.forEach((row, i) => {
                    promises.push((0, traverseFields_1.traverseFields)({
                        data,
                        doc,
                        docWithLocales,
                        errors,
                        fields: field.fields,
                        id,
                        mergeLocaleActions,
                        operation,
                        path: `${path}${field.name}.${i}.`,
                        req,
                        siblingData: row,
                        siblingDoc: (0, getExistingRowDoc_1.getExistingRowDoc)(row, siblingDoc[field.name]),
                        siblingDocWithLocales: (0, getExistingRowDoc_1.getExistingRowDoc)(row, siblingDocWithLocales[field.name]),
                        skipValidation: skipValidationFromHere,
                    }));
                });
                await Promise.all(promises);
            }
            break;
        }
        case 'blocks': {
            const rows = siblingData[field.name];
            if (Array.isArray(rows)) {
                const promises = [];
                rows.forEach((row, i) => {
                    const block = field.blocks.find((blockType) => blockType.slug === row.blockType);
                    if (block) {
                        promises.push((0, traverseFields_1.traverseFields)({
                            data,
                            doc,
                            docWithLocales,
                            errors,
                            fields: block.fields,
                            id,
                            mergeLocaleActions,
                            operation,
                            path: `${path}${field.name}.${i}.`,
                            req,
                            siblingData: row,
                            siblingDoc: (0, getExistingRowDoc_1.getExistingRowDoc)(row, siblingDoc[field.name]),
                            siblingDocWithLocales: (0, getExistingRowDoc_1.getExistingRowDoc)(row, siblingDocWithLocales[field.name]),
                            skipValidation: skipValidationFromHere,
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
                docWithLocales,
                errors,
                fields: field.fields,
                id,
                mergeLocaleActions,
                operation,
                path,
                req,
                siblingData,
                siblingDoc,
                siblingDocWithLocales,
                skipValidation: skipValidationFromHere,
            });
            break;
        }
        case 'tab': {
            let tabPath = path;
            let tabSiblingData = siblingData;
            let tabSiblingDoc = siblingDoc;
            let tabSiblingDocWithLocales = siblingDocWithLocales;
            if ((0, types_1.tabHasName)(field)) {
                tabPath = `${path}${field.name}.`;
                if (typeof siblingData[field.name] !== 'object')
                    siblingData[field.name] = {};
                if (typeof siblingDoc[field.name] !== 'object')
                    siblingDoc[field.name] = {};
                if (typeof siblingDocWithLocales[field.name] !== 'object')
                    siblingDocWithLocales[field.name] = {};
                tabSiblingData = siblingData[field.name];
                tabSiblingDoc = siblingDoc[field.name];
                tabSiblingDocWithLocales = siblingDocWithLocales[field.name];
            }
            await (0, traverseFields_1.traverseFields)({
                data,
                doc,
                docWithLocales,
                errors,
                fields: field.fields,
                id,
                mergeLocaleActions,
                operation,
                path: tabPath,
                req,
                siblingData: tabSiblingData,
                siblingDoc: tabSiblingDoc,
                siblingDocWithLocales: tabSiblingDocWithLocales,
                skipValidation: skipValidationFromHere,
            });
            break;
        }
        case 'tabs': {
            await (0, traverseFields_1.traverseFields)({
                data,
                doc,
                docWithLocales,
                errors,
                fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
                id,
                mergeLocaleActions,
                operation,
                path,
                req,
                siblingData,
                siblingDoc,
                siblingDocWithLocales,
                skipValidation: skipValidationFromHere,
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