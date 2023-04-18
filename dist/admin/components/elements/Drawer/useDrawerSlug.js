"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDrawerSlug = void 0;
const react_1 = require("react");
const _1 = require(".");
const EditDepth_1 = require("../../utilities/EditDepth");
const useDrawerSlug = (slug) => {
    const uuid = (0, react_1.useId)();
    const editDepth = (0, EditDepth_1.useEditDepth)();
    return (0, _1.formatDrawerSlug)({
        slug: `${slug}-${uuid}`,
        depth: editDepth,
    });
};
exports.useDrawerSlug = useDrawerSlug;
//# sourceMappingURL=useDrawerSlug.js.map