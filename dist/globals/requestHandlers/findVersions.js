"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const findVersions_1 = __importDefault(require("../operations/findVersions"));
const isNumber_1 = require("../../utilities/isNumber");
function findVersionsHandler(global) {
    return async function handler(req, res, next) {
        try {
            let page;
            if (typeof req.query.page === 'string') {
                const parsedPage = parseInt(req.query.page, 10);
                if (!Number.isNaN(parsedPage)) {
                    page = parsedPage;
                }
            }
            const options = {
                req,
                globalConfig: global,
                where: req.query.where,
                page,
                limit: (0, isNumber_1.isNumber)(req.query.limit) ? Number(req.query.limit) : undefined,
                sort: req.query.sort,
                depth: (0, isNumber_1.isNumber)(req.query.depth) ? Number(req.query.depth) : undefined,
            };
            const result = await (0, findVersions_1.default)(options);
            return res.status(http_status_1.default.OK).json(result);
        }
        catch (error) {
            return next(error);
        }
    };
}
exports.default = findVersionsHandler;
//# sourceMappingURL=findVersions.js.map