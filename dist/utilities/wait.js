"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
exports.default = wait;
//# sourceMappingURL=wait.js.map