"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findVersions_1 = __importDefault(require("../../operations/findVersions"));
function findVersionsResolver(globalConfig) {
    return async function resolver(_, args, context) {
        const options = {
            globalConfig,
            where: args.where,
            limit: args.limit,
            page: args.page,
            sort: args.sort,
            req: context.req,
            depth: 0,
        };
        const result = await (0, findVersions_1.default)(options);
        return result;
    };
}
exports.default = findVersionsResolver;
//# sourceMappingURL=findVersions.js.map