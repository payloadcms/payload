"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const buildSchema_1 = __importDefault(require("../mongoose/buildSchema"));
const buildQuery_1 = __importDefault(require("../mongoose/buildQuery"));
const buildModel = (config) => {
    if (config.globals && config.globals.length > 0) {
        const globalsSchema = new mongoose_1.default.Schema({}, { discriminatorKey: 'globalType', timestamps: true, minimize: false });
        globalsSchema.plugin((0, buildQuery_1.default)());
        const Globals = mongoose_1.default.model('globals', globalsSchema);
        Object.values(config.globals).forEach((globalConfig) => {
            const globalSchema = (0, buildSchema_1.default)(config, globalConfig.fields, {
                options: {
                    minimize: false,
                },
            });
            Globals.discriminator(globalConfig.slug, globalSchema);
        });
        return Globals;
    }
    return null;
};
exports.default = buildModel;
//# sourceMappingURL=buildModel.js.map