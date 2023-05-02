"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const apiKey_1 = __importDefault(require("../auth/strategies/apiKey"));
const bindCollection_1 = __importDefault(require("./bindCollection"));
const mountEndpoints_1 = __importDefault(require("../express/mountEndpoints"));
const buildEndpoints_1 = __importDefault(require("./buildEndpoints"));
function initCollectionsHTTP(ctx) {
    ctx.config.collections = ctx.config.collections.map((collection) => {
        const formattedCollection = collection;
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
        return formattedCollection;
    });
}
exports.default = initCollectionsHTTP;
//# sourceMappingURL=initHTTP.js.map