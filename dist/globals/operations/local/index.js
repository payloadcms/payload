"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findOne_1 = __importDefault(require("./findOne"));
const update_1 = __importDefault(require("./update"));
const findVersionByID_1 = __importDefault(require("./findVersionByID"));
const findVersions_1 = __importDefault(require("./findVersions"));
const restoreVersion_1 = __importDefault(require("./restoreVersion"));
exports.default = {
    findOne: findOne_1.default,
    update: update_1.default,
    findVersionByID: findVersionByID_1.default,
    findVersions: findVersions_1.default,
    restoreVersion: restoreVersion_1.default,
};
//# sourceMappingURL=index.js.map