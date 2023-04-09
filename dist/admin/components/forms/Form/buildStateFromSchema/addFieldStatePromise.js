"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFieldStatePromise = void 0;
/* eslint-disable no-param-reassign */
const bson_objectid_1 = __importDefault(require("bson-objectid"));
const types_1 = require("../../../../../fields/config/types");
const getDefaultValue_1 = __importDefault(require("../../../../../fields/getDefaultValue"));
const iterateFields_1 = require("./iterateFields");
const addFieldStatePromise = async ({ field, locale, user, state, path, passesCondition, fullData, data, id, operation, t, }) => {
    var _a;
    if ((0, types_1.fieldAffectsData)(field)) {
        const fieldState = {
            valid: true,
            value: undefined,
            initialValue: undefined,
            validate: field.validate,
            condition: (_a = field.admin) === null || _a === void 0 ? void 0 : _a.condition,
            passesCondition,
        };
        const valueWithDefault = await (0, getDefaultValue_1.default)({ value: data === null || data === void 0 ? void 0 : data[field.name], defaultValue: field.defaultValue, locale, user });
        if (data === null || data === void 0 ? void 0 : data[field.name]) {
            data[field.name] = valueWithDefault;
        }
        let validationResult = true;
        if (typeof fieldState.validate === 'function') {
            validationResult = await fieldState.validate(data === null || data === void 0 ? void 0 : data[field.name], {
                ...field,
                data: fullData,
                user,
                siblingData: data,
                id,
                operation,
                t,
            });
        }
        if (typeof validationResult === 'string') {
            fieldState.errorMessage = validationResult;
            fieldState.valid = false;
        }
        else {
            fieldState.valid = true;
        }
        switch (field.type) {
            case 'array': {
                const arrayValue = Array.isArray(valueWithDefault) ? valueWithDefault : [];
                const promises = arrayValue.map((row, i) => {
                    const rowPath = `${path}${field.name}.${i}.`;
                    state[`${rowPath}id`] = {
                        value: row.id,
                        initialValue: row.id || new bson_objectid_1.default().toHexString(),
                        valid: true,
                    };
                    return (0, iterateFields_1.iterateFields)({
                        state,
                        fields: field.fields,
                        data: row,
                        parentPassesCondition: passesCondition,
                        path: rowPath,
                        user,
                        fullData,
                        id,
                        locale,
                        operation,
                        t,
                    });
                });
                await Promise.all(promises);
                // Add values to field state
                if (valueWithDefault === null) {
                    fieldState.value = null;
                    fieldState.initialValue = null;
                }
                else {
                    fieldState.value = arrayValue.length;
                    fieldState.initialValue = arrayValue.length;
                    if (arrayValue.length > 0) {
                        fieldState.disableFormData = true;
                    }
                }
                // Add field to state
                state[`${path}${field.name}`] = fieldState;
                break;
            }
            case 'blocks': {
                const blocksValue = Array.isArray(valueWithDefault) ? valueWithDefault : [];
                const promises = [];
                blocksValue.forEach((row, i) => {
                    const block = field.blocks.find((blockType) => blockType.slug === row.blockType);
                    const rowPath = `${path}${field.name}.${i}.`;
                    if (block) {
                        state[`${rowPath}id`] = {
                            value: row.id,
                            initialValue: row.id || new bson_objectid_1.default().toHexString(),
                            valid: true,
                        };
                        state[`${rowPath}blockType`] = {
                            value: row.blockType,
                            initialValue: row.blockType,
                            valid: true,
                        };
                        state[`${rowPath}blockName`] = {
                            value: row.blockName,
                            initialValue: row.blockName,
                            valid: true,
                        };
                        promises.push((0, iterateFields_1.iterateFields)({
                            state,
                            fields: block.fields,
                            data: row,
                            fullData,
                            parentPassesCondition: passesCondition,
                            path: rowPath,
                            user,
                            locale,
                            operation,
                            id,
                            t,
                        }));
                    }
                });
                await Promise.all(promises);
                // Add values to field state
                if (valueWithDefault === null) {
                    fieldState.value = null;
                    fieldState.initialValue = null;
                }
                else {
                    fieldState.value = blocksValue.length;
                    fieldState.initialValue = blocksValue.length;
                    if (blocksValue.length > 0) {
                        fieldState.disableFormData = true;
                    }
                }
                // Add field to state
                state[`${path}${field.name}`] = fieldState;
                break;
            }
            case 'group': {
                await (0, iterateFields_1.iterateFields)({
                    state,
                    id,
                    operation,
                    fields: field.fields,
                    data: (data === null || data === void 0 ? void 0 : data[field.name]) || {},
                    fullData,
                    parentPassesCondition: passesCondition,
                    path: `${path}${field.name}.`,
                    locale,
                    user,
                    t,
                });
                break;
            }
            default: {
                fieldState.value = valueWithDefault;
                fieldState.initialValue = valueWithDefault;
                // Add field to state
                state[`${path}${field.name}`] = fieldState;
                break;
            }
        }
    }
    else if ((0, types_1.fieldHasSubFields)(field)) {
        // Handle field types that do not use names (row, etc)
        await (0, iterateFields_1.iterateFields)({
            state,
            fields: field.fields,
            data,
            parentPassesCondition: passesCondition,
            path,
            user,
            fullData,
            id,
            locale,
            operation,
            t,
        });
    }
    else if (field.type === 'tabs') {
        const promises = field.tabs.map((tab) => (0, iterateFields_1.iterateFields)({
            state,
            fields: tab.fields,
            data: (0, types_1.tabHasName)(tab) ? data === null || data === void 0 ? void 0 : data[tab.name] : data,
            parentPassesCondition: passesCondition,
            path: (0, types_1.tabHasName)(tab) ? `${path}${tab.name}.` : path,
            user,
            fullData,
            id,
            locale,
            operation,
            t,
        }));
        await Promise.all(promises);
    }
};
exports.addFieldStatePromise = addFieldStatePromise;
//# sourceMappingURL=addFieldStatePromise.js.map