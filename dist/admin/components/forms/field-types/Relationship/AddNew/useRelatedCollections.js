"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRelatedCollections = void 0;
const react_1 = require("react");
const Config_1 = require("../../../../utilities/Config");
const useRelatedCollections = (relationTo) => {
    const config = (0, Config_1.useConfig)();
    const [relatedCollections] = (0, react_1.useState)(() => {
        if (relationTo) {
            const relations = typeof relationTo === 'string' ? [relationTo] : relationTo;
            return relations.map((relation) => config.collections.find((collection) => collection.slug === relation));
        }
        return [];
    });
    return relatedCollections;
};
exports.useRelatedCollections = useRelatedCollections;
//# sourceMappingURL=useRelatedCollections.js.map