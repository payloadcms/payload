"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docWithFilenameExists = async (Model, path, filename) => {
    const doc = await Model.findOne({ filename });
    if (doc)
        return true;
    return false;
};
exports.default = docWithFilenameExists;
//# sourceMappingURL=docWithFilenameExists.js.map