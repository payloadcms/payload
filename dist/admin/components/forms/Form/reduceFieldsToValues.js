"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flatley_1 = require("flatley");
const reduceFieldsToValues = (fields, unflatten) => {
    const data = {};
    Object.keys(fields).forEach((key) => {
        if (!fields[key].disableFormData) {
            data[key] = fields[key].value;
        }
    });
    if (unflatten) {
        return (0, flatley_1.unflatten)(data, { safe: true });
    }
    return data;
};
exports.default = reduceFieldsToValues;
//# sourceMappingURL=reduceFieldsToValues.js.map