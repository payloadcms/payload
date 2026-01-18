import { checkAndMakeDir, debugLog, isFunc, moveFile, promiseCallback, saveBufferToFile } from './utilities.js';
/**
 * Returns Local function that moves the file to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 */ const moveFromTemp = (filePath, options, fileUploadOptions)=>(resolve, reject)=>{
        debugLog(fileUploadOptions, `Moving temporary file ${options.tempFilePath} to ${filePath}`);
        moveFile(options.tempFilePath, filePath, promiseCallback(resolve, reject));
    };
/**
 * Returns Local function that moves the file from buffer to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 */ const moveFromBuffer = (filePath, options, fileUploadOptions)=>(resolve, reject)=>{
        debugLog(fileUploadOptions, `Moving uploaded buffer to ${filePath}`);
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        saveBufferToFile(options.buffer, filePath, promiseCallback(resolve, reject));
    };
export const fileFactory = (options, fileUploadOptions)=>{
    // see: https://github.com/richardgirges/express-fileupload/issues/14
    // firefox uploads empty file in case of cache miss when f5ing page.
    // resulting in unexpected behavior. if there is no file data, the file is invalid.
    // if (!fileUploadOptions.useTempFiles && !options.buffer.length) return;
    // Create and return file object.
    return {
        name: options.name,
        data: options.buffer,
        encoding: options.encoding,
        md5: options.hash,
        mimetype: options.mimetype,
        mv: (filePath, callback)=>{
            // Define a proper move function.
            const moveFunc = fileUploadOptions.useTempFiles ? moveFromTemp(filePath, options, fileUploadOptions) : moveFromBuffer(filePath, options, fileUploadOptions);
            // Create a folder for a file.
            checkAndMakeDir(fileUploadOptions, filePath);
            // If callback is passed in, use the callback API, otherwise return a promise.
            const defaultReject = ()=>undefined;
            return isFunc(callback) ? moveFunc(callback, defaultReject) : new Promise(moveFunc);
        },
        size: options.size,
        tempFilePath: options.tempFilePath,
        truncated: options.truncated
    };
};

//# sourceMappingURL=fileFactory.js.map