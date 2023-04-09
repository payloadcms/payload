/// <reference types="node" />
/**
 * Save buffer data to a file.
 * @param {Buffer} buffer - buffer to save to a file.
 * @param {string} filePath - path to a file.
 */
declare const saveBufferToFile: (buffer: Buffer, filePath: string) => Promise<void>;
export default saveBufferToFile;
