"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_1 = __importDefault(require("./find"));
const findByID_1 = __importDefault(require("./findByID"));
const create_1 = __importDefault(require("./create"));
const update_1 = __importDefault(require("./update"));
const delete_1 = __importDefault(require("./delete"));
const local_1 = __importDefault(require("../../../auth/operations/local"));
const findVersionByID_1 = __importDefault(require("./findVersionByID"));
const findVersions_1 = __importDefault(require("./findVersions"));
const restoreVersion_1 = __importDefault(require("./restoreVersion"));
exports.default = {
    find: find_1.default,
    findByID: findByID_1.default,
    create: create_1.default,
    update: update_1.default,
    deleteLocal: delete_1.default,
    auth: local_1.default,
    findVersionByID: findVersionByID_1.default,
    findVersions: findVersions_1.default,
    restoreVersion: restoreVersion_1.default,
};
//# sourceMappingURL=index.js.map