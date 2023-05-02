"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGraphQLSchema = void 0;
/* eslint-disable no-nested-ternary */
const fs_1 = __importDefault(require("fs"));
const graphql_1 = require("graphql");
const logger_1 = __importDefault(require("../utilities/logger"));
const load_1 = __importDefault(require("../config/load"));
const __1 = __importDefault(require(".."));
async function generateGraphQLSchema() {
    const logger = (0, logger_1.default)();
    const config = await (0, load_1.default)();
    await __1.default.init({
        secret: '--unused--',
        mongoURL: false,
        local: true,
    });
    logger.info('Compiling GraphQL schema...');
    fs_1.default.writeFileSync(config.graphQL.schemaOutputFile, (0, graphql_1.printSchema)(__1.default.schema));
    logger.info(`GraphQL written to ${config.graphQL.schemaOutputFile}`);
}
exports.generateGraphQLSchema = generateGraphQLSchema;
// when generateGraphQLSchema.js is launched directly
if (module.id === require.main.id) {
    generateGraphQLSchema();
}
//# sourceMappingURL=generateGraphQLSchema.js.map