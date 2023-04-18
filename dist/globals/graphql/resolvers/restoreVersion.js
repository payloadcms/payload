"use strict";
/* eslint-disable no-param-reassign */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const restoreVersion_1 = __importDefault(require("../../operations/restoreVersion"));
function restoreVersionResolver(globalConfig) {
    return async function resolver(_, args, context) {
        const options = {
            id: args.id,
            globalConfig,
            req: context.req,
            depth: 0,
        };
        const result = await (0, restoreVersion_1.default)(options);
        return result;
    };
}
exports.default = restoreVersionResolver;
//# sourceMappingURL=restoreVersion.js.map