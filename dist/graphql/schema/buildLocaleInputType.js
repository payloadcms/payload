"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const formatName_1 = __importDefault(require("../utilities/formatName"));
const buildLocaleInputType = (localization) => {
    return new graphql_1.GraphQLEnumType({
        name: 'LocaleInputType',
        values: localization.locales.reduce((values, locale) => ({
            ...values,
            [(0, formatName_1.default)(locale)]: {
                value: locale,
            },
        }), {}),
    });
};
exports.default = buildLocaleInputType;
//# sourceMappingURL=buildLocaleInputType.js.map