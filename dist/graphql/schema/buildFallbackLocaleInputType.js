"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const formatName_1 = __importDefault(require("../utilities/formatName"));
const buildFallbackLocaleInputType = (localization) => new graphql_1.GraphQLEnumType({
    name: 'FallbackLocaleInputType',
    values: [...localization.locales, 'none'].reduce((values, locale) => ({
        ...values,
        [(0, formatName_1.default)(locale)]: {
            value: locale,
        },
    }), {}),
});
exports.default = buildFallbackLocaleInputType;
//# sourceMappingURL=buildFallbackLocaleInputType.js.map