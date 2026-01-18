import path from 'path';
export const getGenerateURL = ({ bucket, getStorageClient })=>({ filename, prefix = '' })=>{
        return decodeURIComponent(getStorageClient().bucket(bucket).file(path.posix.join(prefix, filename)).publicUrl());
    };

//# sourceMappingURL=generateURL.js.map