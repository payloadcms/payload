"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
exports.default = (config) => {
    const defaultMethods = ['jwt', 'anonymous'];
    const methods = config.collections.reduce((enabledMethods, collection) => {
        if (typeof collection.auth === 'object') {
            const collectionMethods = [...enabledMethods];
            if (Array.isArray(collection.auth.strategies)) {
                collection.auth.strategies.forEach(({ name, strategy }) => {
                    collectionMethods.unshift(`${collection.slug}-${name !== null && name !== void 0 ? name : strategy.name}`);
                });
            }
            if (collection.auth.useAPIKey) {
                collectionMethods.unshift(`${collection.slug}-api-key`);
            }
            return collectionMethods;
        }
        return enabledMethods;
    }, defaultMethods);
    const authenticate = passport_1.default.authenticate(methods, { session: false });
    return authenticate;
};
//# sourceMappingURL=authenticate.js.map