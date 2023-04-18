"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreVersion = exports.findVersionByID = exports.findVersions = exports.update = exports.findOne = void 0;
const findOne_1 = __importDefault(require("./findOne"));
exports.findOne = findOne_1.default;
const update_1 = __importDefault(require("./update"));
exports.update = update_1.default;
const findVersions_1 = __importDefault(require("./findVersions"));
exports.findVersions = findVersions_1.default;
const findVersionByID_1 = __importDefault(require("./findVersionByID"));
exports.findVersionByID = findVersionByID_1.default;
const restoreVersion_1 = __importDefault(require("./restoreVersion"));
exports.restoreVersion = restoreVersion_1.default;
//# sourceMappingURL=index.js.map