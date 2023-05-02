"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
const getDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);
const checkDuplicateCollections = (collections) => {
    const duplicateSlugs = getDuplicates(collections.map((c) => c.slug));
    if (duplicateSlugs.length > 0) {
        throw new errors_1.DuplicateCollection('slug', duplicateSlugs);
    }
};
exports.default = checkDuplicateCollections;
//# sourceMappingURL=checkDuplicateCollections.js.map