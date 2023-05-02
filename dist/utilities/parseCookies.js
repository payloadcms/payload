"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseCookies(req) {
    const list = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach((cookie) => {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    return list;
}
exports.default = parseCookies;
//# sourceMappingURL=parseCookies.js.map