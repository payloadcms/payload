"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getCookieExpiration = (seconds = 7200) => {
    const currentTime = new Date();
    currentTime.setSeconds(currentTime.getSeconds() + seconds);
    return currentTime;
};
exports.default = getCookieExpiration;
//# sourceMappingURL=getCookieExpiration.js.map