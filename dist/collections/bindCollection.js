"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bindCollectionMiddleware = (collection) => (req, res, next) => {
    req.collection = collection;
    next();
};
exports.default = bindCollectionMiddleware;
//# sourceMappingURL=bindCollection.js.map