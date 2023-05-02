"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const fs_1 = __importDefault(require("fs"));
/**
 * Save buffer data to a file.
 * @param {Buffer} buffer - buffer to save to a file.
 * @param {string} filePath - path to a file.
 */
const saveBufferToFile = async (buffer, filePath) => {
    // Setup readable stream from buffer.
    let streamData = buffer;
    const readStream = new stream_1.Readable();
    readStream._read = () => {
        readStream.push(streamData);
        streamData = null;
    };
    // Setup file system writable stream.
    return fs_1.default.writeFileSync(filePath, buffer);
};
exports.default = saveBufferToFile;
//# sourceMappingURL=saveBufferToFile.js.map