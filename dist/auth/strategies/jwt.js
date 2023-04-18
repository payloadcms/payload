"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = __importDefault(require("url"));
const passport_jwt_1 = __importDefault(require("passport-jwt"));
const getExtractJWT_1 = __importDefault(require("../getExtractJWT"));
const JwtStrategy = passport_jwt_1.default.Strategy;
exports.default = ({ secret, config, collections }) => {
    const opts = {
        passReqToCallback: true,
        jwtFromRequest: (0, getExtractJWT_1.default)(config),
        secretOrKey: secret,
    };
    return new JwtStrategy(opts, async (req, token, done) => {
        if (req.user) {
            done(null, req.user);
        }
        try {
            const collection = collections[token.collection];
            const parsedURL = url_1.default.parse(req.url);
            const isGraphQL = parsedURL.pathname === config.routes.graphQL;
            const user = await req.payload.findByID({
                id: token.id,
                collection: token.collection,
                req,
                depth: isGraphQL ? 0 : collection.config.auth.depth,
            });
            if (user && (!collection.config.auth.verify || user._verified)) {
                user.collection = collection.config.slug;
                user._strategy = 'local-jwt';
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
//# sourceMappingURL=jwt.js.map