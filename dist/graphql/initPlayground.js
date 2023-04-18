"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_playground_middleware_express_1 = __importDefault(require("graphql-playground-middleware-express"));
function initPlayground(ctx) {
    if ((!ctx.config.graphQL.disable && !ctx.config.graphQL.disablePlaygroundInProduction && process.env.NODE_ENV === 'production') || process.env.NODE_ENV !== 'production') {
        ctx.router.get(ctx.config.routes.graphQLPlayground, (0, graphql_playground_middleware_express_1.default)({
            endpoint: `${ctx.config.routes.api}${ctx.config.routes.graphQL}`,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore ISettings interface has all properties required for some reason
            settings: {
                'request.credentials': 'include',
            },
        }));
    }
}
exports.default = initPlayground;
//# sourceMappingURL=initPlayground.js.map