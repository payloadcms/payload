"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docAccessResolver = void 0;
const docAccess_1 = require("../../operations/docAccess");
function docAccessResolver() {
    async function resolver(_, args, context) {
        return (0, docAccess_1.docAccess)({
            req: context.req,
            id: args.id,
        });
    }
    return resolver;
}
exports.docAccessResolver = docAccessResolver;
//# sourceMappingURL=docAccess.js.map