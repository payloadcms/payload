import path from 'path';
export const getGenerateUrl = ({ baseUrl })=>{
    return ({ filename, prefix = '' })=>{
        return `${baseUrl}/${path.posix.join(prefix, encodeURIComponent(filename))}`;
    };
};

//# sourceMappingURL=generateURL.js.map