"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function init(args) {
    const { Model, } = args;
    const count = await Model.countDocuments({});
    return count >= 1;
}
exports.default = init;
//# sourceMappingURL=init.js.map