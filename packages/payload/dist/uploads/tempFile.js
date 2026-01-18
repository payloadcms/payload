import fs from 'fs/promises';
import os from 'node:os';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
async function runTask(temporaryPath, callback) {
    try {
        return await callback(temporaryPath);
    } finally{
        await fs.rm(temporaryPath, {
            force: true,
            maxRetries: 2,
            recursive: true
        });
    }
}
export const temporaryFileTask = async (callback, options = {})=>{
    const filePath = await temporaryFile(options);
    return runTask(filePath, callback);
};
async function temporaryFile(options) {
    if (options.name) {
        if (options.extension !== undefined && options.extension !== null) {
            throw new Error('The `name` and `extension` options are mutually exclusive');
        }
        return path.join(await temporaryDirectory(), options.name);
    }
    return await getPath() + (options.extension === undefined || options.extension === null ? '' : '.' + options.extension.replace(/^\./, ''));
}
async function temporaryDirectory({ prefix = '' } = {}) {
    const directory = await getPath(prefix);
    await fs.mkdir(directory);
    return directory;
}
async function getPath(prefix = '') {
    const temporaryDirectory = await fs.realpath(os.tmpdir());
    return path.join(temporaryDirectory, prefix + uuid());
}

//# sourceMappingURL=tempFile.js.map