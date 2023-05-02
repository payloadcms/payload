"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterateFields_1 = require("./iterateFields");
const buildStateFromSchema = async (args) => {
    const { fieldSchema, data: fullData = {}, user, id, operation, locale, t, } = args;
    if (fieldSchema) {
        const state = {};
        await (0, iterateFields_1.iterateFields)({
            state,
            fields: fieldSchema,
            id,
            locale,
            operation,
            path: '',
            user,
            data: fullData,
            fullData,
            parentPassesCondition: true,
            t,
        });
        return state;
    }
    return {};
};
exports.default = buildStateFromSchema;
//# sourceMappingURL=index.js.map