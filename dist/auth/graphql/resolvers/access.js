"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const formatName_1 = __importDefault(require("../../../graphql/utilities/formatName"));
const access_1 = __importDefault(require("../../operations/access"));
const formatConfigNames = (results, configs) => {
    const formattedResults = { ...results };
    configs.forEach(({ slug }) => {
        const result = { ...(formattedResults[slug] || {}) };
        delete formattedResults[slug];
        formattedResults[(0, formatName_1.default)(slug)] = result;
    });
    return formattedResults;
};
function accessResolver(payload) {
    async function resolver(_, args, context) {
        const options = {
            req: context.req,
        };
        const accessResults = await (0, access_1.default)(options);
        return {
            ...accessResults,
            ...formatConfigNames(accessResults.collections, payload.config.collections),
            ...formatConfigNames(accessResults.globals, payload.config.globals),
        };
    }
    return resolver;
}
exports.default = accessResolver;
//# sourceMappingURL=access.js.map