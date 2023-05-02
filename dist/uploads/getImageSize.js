"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const probe_image_size_1 = __importDefault(require("probe-image-size"));
async function default_1(file) {
    if (file.tempFilePath) {
        const data = fs_1.default.readFileSync(file.tempFilePath);
        return probe_image_size_1.default.sync(data);
    }
    return probe_image_size_1.default.sync(file.data);
}
exports.default = default_1;
//# sourceMappingURL=getImageSize.js.map