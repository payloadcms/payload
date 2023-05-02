"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getExtractJWT_1 = __importDefault(require("../getExtractJWT"));
async function me({ req, collection, }) {
    const extractJWT = (0, getExtractJWT_1.default)(req.payload.config);
    let response = {
        user: null,
    };
    if (req.user) {
        const user = { ...req.user };
        if (user.collection !== collection.config.slug) {
            return {
                user: null,
            };
        }
        delete user.collection;
        response = {
            user,
            collection: req.user.collection,
        };
        const token = extractJWT(req);
        if (token) {
            response.token = token;
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded)
                response.exp = decoded.exp;
        }
    }
    // /////////////////////////////////////
    // After Me - Collection
    // /////////////////////////////////////
    await collection.config.hooks.afterMe.reduce(async (priorHook, hook) => {
        await priorHook;
        response = await hook({
            req,
            response,
        }) || response;
    }, Promise.resolve());
    return response;
}
exports.default = me;
//# sourceMappingURL=me.js.map