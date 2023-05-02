"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const buildQuery_1 = __importDefault(require("../mongoose/buildQuery"));
const buildSchema_1 = __importDefault(require("../mongoose/buildSchema"));
const buildCollectionSchema = (collection, config, schemaOptions = {}) => {
    const schema = (0, buildSchema_1.default)(config, collection.fields, {
        draftsEnabled: Boolean(typeof (collection === null || collection === void 0 ? void 0 : collection.versions) === 'object' && collection.versions.drafts),
        options: {
            timestamps: collection.timestamps !== false,
            minimize: false,
            ...schemaOptions,
        },
        indexSortableFields: config.indexSortableFields,
    });
    if (config.indexSortableFields && collection.timestamps !== false) {
        schema.index({ updatedAt: 1 });
        schema.index({ createdAt: 1 });
    }
    if (collection.indexes) {
        collection.indexes.forEach((index) => {
            schema.index(index.fields, index.options);
        });
    }
    schema.plugin(mongoose_paginate_v2_1.default, { useEstimatedCount: true })
        .plugin((0, buildQuery_1.default)({ collectionSlug: collection.slug }));
    return schema;
};
exports.default = buildCollectionSchema;
//# sourceMappingURL=buildSchema.js.map