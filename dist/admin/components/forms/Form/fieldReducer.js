"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deep_equal_1 = __importDefault(require("deep-equal"));
const getSiblingData_1 = __importDefault(require("./getSiblingData"));
const reduceFieldsToValues_1 = __importDefault(require("./reduceFieldsToValues"));
const deepCopyObject_1 = __importDefault(require("../../../../utilities/deepCopyObject"));
const rows_1 = require("./rows");
function fieldReducer(state, action) {
    switch (action.type) {
        case 'REPLACE_STATE': {
            const newState = {};
            // Only update fields that have changed
            // by comparing old value / initialValue to new
            // ..
            // This is a performance enhancement for saving
            // large documents with hundreds of fields
            Object.entries(action.state).forEach(([path, field]) => {
                const oldField = state[path];
                const newField = field;
                if (!(0, deep_equal_1.default)(oldField, newField)) {
                    newState[path] = newField;
                }
                else if (oldField) {
                    newState[path] = oldField;
                }
            });
            return newState;
        }
        case 'REMOVE': {
            const newState = { ...state };
            if (newState[action.path])
                delete newState[action.path];
            return newState;
        }
        case 'REMOVE_ROW': {
            const { rowIndex, path } = action;
            const { remainingFields, rows } = (0, rows_1.separateRows)(path, state);
            rows.splice(rowIndex, 1);
            const newState = {
                ...remainingFields,
                [path]: {
                    ...state[path],
                    value: rows.length,
                    disableFormData: rows.length > 0,
                },
                ...(0, rows_1.flattenRows)(path, rows),
            };
            return newState;
        }
        case 'ADD_ROW': {
            const { rowIndex, path, subFieldState, blockType, } = action;
            if (blockType) {
                subFieldState.blockType = {
                    value: blockType,
                    initialValue: blockType,
                    valid: true,
                };
            }
            const { remainingFields, rows } = (0, rows_1.separateRows)(path, state);
            rows.splice(rowIndex + 1, 0, subFieldState);
            const newState = {
                ...remainingFields,
                [path]: {
                    ...state[path],
                    value: rows.length,
                    disableFormData: true,
                },
                ...(0, rows_1.flattenRows)(path, rows),
            };
            return newState;
        }
        case 'DUPLICATE_ROW': {
            const { rowIndex, path, } = action;
            const { remainingFields, rows } = (0, rows_1.separateRows)(path, state);
            const duplicate = (0, deepCopyObject_1.default)(rows[rowIndex]);
            if (duplicate.id)
                delete duplicate.id;
            // If there are subfields
            if (Object.keys(duplicate).length > 0) {
                // Add new object containing subfield names to unflattenedRows array
                rows.splice(rowIndex + 1, 0, duplicate);
            }
            const newState = {
                ...remainingFields,
                [path]: {
                    ...state[path],
                    value: rows.length,
                    disableFormData: true,
                },
                ...(0, rows_1.flattenRows)(path, rows),
            };
            return newState;
        }
        case 'MOVE_ROW': {
            const { moveFromIndex, moveToIndex, path } = action;
            const { remainingFields, rows } = (0, rows_1.separateRows)(path, state);
            // copy the row to move
            const copyOfMovingRow = rows[moveFromIndex];
            // delete the row by index
            rows.splice(moveFromIndex, 1);
            // insert row copyOfMovingRow back in
            rows.splice(moveToIndex, 0, copyOfMovingRow);
            const newState = {
                ...remainingFields,
                ...(0, rows_1.flattenRows)(path, rows),
            };
            return newState;
        }
        case 'MODIFY_CONDITION': {
            const { path, result } = action;
            return Object.entries(state).reduce((newState, [fieldPath, field]) => {
                if (fieldPath === path || fieldPath.indexOf(`${path}.`) === 0) {
                    let passesCondition = result;
                    // If a condition is being set to true,
                    // Set all conditions to true
                    // Besides those who still fail their own conditions
                    if (passesCondition && field.condition) {
                        passesCondition = field.condition((0, reduceFieldsToValues_1.default)(state), (0, getSiblingData_1.default)(state, path));
                    }
                    return {
                        ...newState,
                        [fieldPath]: {
                            ...field,
                            passesCondition,
                        },
                    };
                }
                return {
                    ...newState,
                    [fieldPath]: {
                        ...field,
                    },
                };
            }, {});
        }
        case 'UPDATE': {
            const newField = Object.entries(action).reduce((field, [key, value]) => {
                if (['value', 'valid', 'errorMessage', 'disableFormData', 'initialValue', 'validate', 'condition', 'passesCondition'].includes(key)) {
                    return {
                        ...field,
                        [key]: value,
                    };
                }
                return field;
            }, state[action.path] || {});
            return {
                ...state,
                [action.path]: newField,
            };
        }
        default: {
            return state;
        }
    }
}
exports.default = fieldReducer;
//# sourceMappingURL=fieldReducer.js.map