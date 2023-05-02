"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const docWithFilenameExists_1 = __importDefault(require("./docWithFilenameExists"));
const fileExists_1 = __importDefault(require("./fileExists"));
const incrementName = (name) => {
    const extension = name.split('.').pop();
    const baseFilename = (0, sanitize_filename_1.default)(name.substring(0, name.lastIndexOf('.')) || name);
    let incrementedName = baseFilename;
    const regex = /(.*)-(\d)$/;
    const found = baseFilename.match(regex);
    if (found === null) {
        incrementedName += '-1';
    }
    else {
        const matchedName = found[1];
        const matchedNumber = found[2];
        const incremented = Number(matchedNumber) + 1;
        incrementedName = `${matchedName}-${incremented}`;
    }
    return `${incrementedName}.${extension}`;
};
async function getSafeFileName(Model, staticPath, desiredFilename) {
    let modifiedFilename = desiredFilename;
    // eslint-disable-next-line no-await-in-loop
    while (await (0, docWithFilenameExists_1.default)(Model, staticPath, modifiedFilename) || await (0, fileExists_1.default)(`${staticPath}/${modifiedFilename}`)) {
        modifiedFilename = incrementName(modifiedFilename);
    }
    return modifiedFilename;
}
exports.default = getSafeFileName;
//# sourceMappingURL=getSafeFilename.js.map