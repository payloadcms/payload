import path from 'path';
export const getGenerateURL = ({ baseURL, containerName })=>({ filename, prefix = '' })=>{
        return `${baseURL}/${containerName}/${path.posix.join(prefix, filename)}`;
    };

//# sourceMappingURL=generateURL.js.map