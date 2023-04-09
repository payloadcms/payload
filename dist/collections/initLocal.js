"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const passport_local_mongoose_1 = __importDefault(require("passport-local-mongoose"));
const mongoose_aggregate_paginate_v2_1 = __importDefault(require("mongoose-aggregate-paginate-v2"));
const buildCollectionFields_1 = require("../versions/buildCollectionFields");
const buildQuery_1 = __importDefault(require("../mongoose/buildQuery"));
const buildSchema_1 = __importDefault(require("./buildSchema"));
const buildSchema_2 = __importDefault(require("../mongoose/buildSchema"));
const getVersionsModelName_1 = require("../versions/getVersionsModelName");
function initCollectionsLocal(ctx) {
    ctx.config.collections = ctx.config.collections.map((collection) => {
        var _a;
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
                    timestamps: false,
                    minimize: false,
                },
            });
            versionSchema.plugin(mongoose_paginate_v2_1.default, { useEstimatedCount: true })
                .plugin(buildQuery_1.default);
            if ((_a = collection.versions) === null || _a === void 0 ? void 0 : _a.drafts) {
                versionSchema.plugin(mongoose_aggregate_paginate_v2_1.default);
            }
            ctx.versions[collection.slug] = mongoose_1.default.model(versionModelName, versionSchema);
        }
        ctx.collections[formattedCollection.slug] = {
            Model: mongoose_1.default.model(formattedCollection.slug, schema),
            config: formattedCollection,
        };
        return formattedCollection;
    });
}
exports.default = initCollectionsLocal;
//# sourceMappingURL=initLocal.js.map