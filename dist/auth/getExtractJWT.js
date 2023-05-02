"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parseCookies_1 = __importDefault(require("../utilities/parseCookies"));
const getExtractJWT = (config) => (req) => {
    if (req && req.get) {
        const jwtFromHeader = req.get('Authorization');
        const origin = req.get('Origin');
        if (jwtFromHeader && jwtFromHeader.indexOf('JWT ') === 0) {
            return jwtFromHeader.replace('JWT ', '');
        }
        const cookies = (0, parseCookies_1.default)(req);
        const tokenCookieName = `${config.cookiePrefix}-token`;
        if (cookies && cookies[tokenCookieName]) {
            if (!origin || config.csrf.length === 0 || config.csrf.indexOf(origin) > -1) {
                return cookies[tokenCookieName];
            }
        }
    }
    return null;
};
exports.default = getExtractJWT;
//# sourceMappingURL=getExtractJWT.js.map