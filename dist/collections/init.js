"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const passport_local_mongoose_1 = __importDefault(require("passport-local-mongoose"));
const buildCollectionFields_1 = require("../versions/buildCollectionFields");
const buildQuery_1 = __importDefault(require("../mongoose/buildQuery"));
const apiKey_1 = __importDefault(require("../auth/strategies/apiKey"));
const buildSchema_1 = __importDefault(require("./buildSchema"));
const buildSchema_2 = __importDefault(require("../mongoose/buildSchema"));
const bindCollection_1 = __importDefault(require("./bindCollection"));
const getVersionsModelName_1 = require("../versions/getVersionsModelName");
const mountEndpoints_1 = __importDefault(require("../express/mountEndpoints"));
const buildEndpoints_1 = __importDefault(require("./buildEndpoints"));
function registerCollections(ctx) {
    ctx.config.collections = ctx.config.collections.map((collection) => {
        const formattedCollection = collection;
        const schema = (0, buildSchema_1.default)(formattedCollection, ctx.config);
        if (collection.auth && !collection.auth.disableLocalStrategy) {
            schema.plugin(passport_local_mongoose_1.default, {
                usernameField: 'email',
            });
            const { maxLoginAttempts, lockTime } = collection.auth;
            if (maxLoginAttempts > 0) {
                // eslint-disable-next-line func-names
                schema.methods.incLoginAttempts = function (cb) {
                    // Expired lock, restart count at 1
                    if (this.lockUntil && this.lockUntil < Date.now()) {
                        return this.updateOne({
                            $set: { loginAttempts: 1 },
                            $unset: { lockUntil: 1 },
                        }, cb);
                    }
                    const updates = { $inc: { loginAttempts: 1 } };
                    // Lock the account if at max attempts and not already locked
                    if (this.loginAttempts + 1 >= maxLoginAttempts) {
                        updates.$set = { lockUntil: Date.now() + lockTime };
                    }
                    return this.updateOne(updates, cb);
                };
                // eslint-disable-next-line func-names
                schema.methods.resetLoginAttempts = function (cb) {
                    return this.updateOne({
                        $set: { loginAttempts: 0 },
                        $unset: { lockUntil: 1 },
                    }, cb);
                };
            }
        }
        if (collection.versions) {
            const versionModelName = (0, getVersionsModelName_1.getVersionsModelName)(collection);
            const versionSchema = (0, buildSchema_2.default)(ctx.config, (0, buildCollectionFields_1.buildVersionCollectionFields)(collection), {
                disableUnique: true,
                draftsEnabled: true,
                options: {
                    timestamps: true,
                },
            });
            versionSchema.plugin(mongoose_paginate_v2_1.default, { useEstimatedCount: true })
                .plugin(buildQuery_1.default);
            ctx.versions[collection.slug] = mongoose_1.default.model(versionModelName, versionSchema);
        }
        ctx.collections[formattedCollection.slug] = {
            Model: mongoose_1.default.model(formattedCollection.slug, schema),
            config: formattedCollection,
        };
        // If not local, open routes
        if (!ctx.local) {
            const router = express_1.default.Router();
            const { slug } = collection;
            router.all('*', (0, bindCollection_1.default)(ctx.collections[formattedCollection.slug]));
            if (collection.auth) {
                const AuthCollection = ctx.collections[formattedCollection.slug];
                if (collection.auth.useAPIKey) {
                    passport_1.default.use(`${AuthCollection.config.slug}-api-key`, (0, apiKey_1.default)(ctx, AuthCollection));
                }
                if (Array.isArray(collection.auth.strategies)) {
                    collection.auth.strategies.forEach(({ name, strategy }, index) => {
                        const passportStrategy = typeof strategy === 'object' ? strategy : strategy(ctx);
                        passport_1.default.use(`${AuthCollection.config.slug}-${name !== null && name !== void 0 ? name : index}`, passportStrategy);
                    });
                }
            }
            const endpoints = (0, buildEndpoints_1.default)(collection);
            (0, mountEndpoints_1.default)(ctx.express, router, endpoints);
            ctx.router.use(`/${slug}`, router);
        }
        return formattedCollection;
    });
}
exports.default = registerCollections;
//# sourceMappingURL=init.js.map