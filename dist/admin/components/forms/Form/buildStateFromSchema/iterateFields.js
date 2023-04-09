"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iterateFields = void 0;
const types_1 = require("../../../../../fields/config/types");
const addFieldStatePromise_1 = require("./addFieldStatePromise");
const iterateFields = async ({ fields, data, parentPassesCondition, path = '', fullData, user, locale, operation, id, state, t, }) => {
    const promises = [];
    fields.forEach((field) => {
        var _a, _b;
        const initialData = data;
        if (!(0, types_1.fieldIsPresentationalOnly)(field) && !((_a = field === null || field === void 0 ? void 0 : field.admin) === null || _a === void 0 ? void 0 : _a.disabled)) {
            const passesCondition = Boolean((((_b = field === null || field === void 0 ? void 0 : field.admin) === null || _b === void 0 ? void 0 : _b.condition) ? field.admin.condition(fullData || {}, initialData || {}) : true) && parentPassesCondition);
            promises.push((0, addFieldStatePromise_1.addFieldStatePromise)({
                fullData,
                id,
                locale,
                operation,
                path,
                state,
                user,
                field,
                passesCondition,
                data,
                t,
            }));
        }
    });
    await Promise.all(promises);
};
exports.iterateFields = iterateFields;
//# sourceMappingURL=iterateFields.js.map