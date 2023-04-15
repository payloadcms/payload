"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const buildQuery_1 = __importDefault(require("../mongoose/buildQuery"));
const buildModel_1 = __importDefault(require("./buildModel"));
const getVersionsModelName_1 = require("../versions/getVersionsModelName");
const buildGlobalFields_1 = require("../versions/buildGlobalFields");
const buildSchema_1 = __importDefault(require("../mongoose/buildSchema"));
const mountEndpoints_1 = __importDefault(require("../express/mountEndpoints"));
const buildEndpoints_1 = __importDefault(require("./buildEndpoints"));
function initGlobals(ctx) {
    if (ctx.config.globals) {
        ctx.globals = {
            Model: (0, buildModel_1.default)(ctx.config),
            config: ctx.config.globals,
        };
        ctx.config.globals.forEach((global) => {
            if (global.versions) {
                const versionModelName = (0, getVersionsModelName_1.getVersionsModelName)(global);
                const versionSchema = (0, buildSchema_1.default)(ctx.config, (0, buildGlobalFields_1.buildVersionGlobalFields)(global), {
                    disableUnique: true,
                    draftsEnabled: true,
                    options: {
                        timestamps: true,
                    },
                });
                versionSchema.plugin(mongoose_paginate_v2_1.default, { useEstimatedCount: true })
                    .plugin(buildQuery_1.default);
                ctx.versions[global.slug] = mongoose_1.default.model(versionModelName, versionSchema);
            }
        });
        // If not local, open routes
        if (!ctx.local) {
            ctx.config.globals.forEach((global) => {
                const router = express_1.default.Router();
                const { slug } = global;
                const endpoints = (0, buildEndpoints_1.default)(global);
                (0, mountEndpoints_1.default)(ctx.express, router, endpoints);
                ctx.router.use(`/globals/${slug}`, router);
            });
        }
    }
}
exports.default = initGlobals;
//# sourceMappingURL=init.js.map