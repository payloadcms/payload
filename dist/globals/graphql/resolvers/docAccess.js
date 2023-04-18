"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docAccessResolver = void 0;
const docAccess_1 = require("../../operations/docAccess");
function docAccessResolver(global) {
    async function resolver(_, context) {
        return (0, docAccess_1.docAccess)({
            req: context.req,
            globalConfig: global,
        });
    }
    return resolver;
}
exports.docAccessResolver = docAccessResolver;
//# sourceMappingURL=docAccess.js.map