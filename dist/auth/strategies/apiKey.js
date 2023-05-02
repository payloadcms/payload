"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_headerapikey_1 = __importDefault(require("passport-headerapikey"));
const crypto_1 = __importDefault(require("crypto"));
const find_1 = __importDefault(require("../../collections/operations/find"));
exports.default = (payload, { Model, config }) => {
    const { secret } = payload;
    const opts = {
        header: 'Authorization',
        prefix: `${config.slug} API-Key `,
    };
    return new passport_headerapikey_1.default(opts, true, async (apiKey, done, req) => {
        const apiKeyIndex = crypto_1.default.createHmac('sha1', secret)
            .update(apiKey)
            .digest('hex');
        try {
            const where = {};
            if (config.auth.verify) {
                where.and = [
                    {
                        // TODO: Search for index
                        apiKeyIndex: {
                            equals: apiKeyIndex,
                        },
                    },
                    {
                        _verified: {
                            not_equals: false,
                        },
                    },
                ];
            }
            else {
                where.apiKeyIndex = {
                    equals: apiKeyIndex,
                };
            }
            const userQuery = await (0, find_1.default)({
                where,
                collection: {
                    Model,
                    config,
                },
                req: req,
                overrideAccess: true,
                depth: config.auth.depth,
            });
            if (userQuery.docs && userQuery.docs.length > 0) {
                const user = userQuery.docs[0];
                user.collection = config.slug;
                user._strategy = 'api-key';
                done(null, user);
            }
            else {
                done(null, false);
            }
        }
        catch (err) {
            done(null, false);
        }
    });
};
//# sourceMappingURL=apiKey.js.map