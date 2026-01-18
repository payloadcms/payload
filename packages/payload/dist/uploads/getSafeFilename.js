import sanitize from 'sanitize-filename';
import { docWithFilenameExists } from './docWithFilenameExists.js';
import { fileExists } from './fileExists.js';
const incrementName = (name)=>{
    const extension = name.split('.').pop();
    const baseFilename = sanitize(name.substring(0, name.lastIndexOf('.')) || name);
    let incrementedName = baseFilename;
    const regex = /(.*)-(\d+)$/;
    const found = baseFilename.match(regex);
    if (found === null) {
        incrementedName += '-1';
    } else {
        const matchedName = found[1];
        const matchedNumber = found[2];
        const incremented = Number(matchedNumber) + 1;
        incrementedName = `${matchedName}-${incremented}`;
    }
    return `${incrementedName}.${extension}`;
};
export async function getSafeFileName({ collectionSlug, desiredFilename, prefix, req, staticPath }) {
    let modifiedFilename = desiredFilename;
    while(await docWithFilenameExists({
        collectionSlug,
        filename: modifiedFilename,
        path: staticPath,
        prefix,
        req
    }) || await fileExists(`${staticPath}/${modifiedFilename}`)){
        modifiedFilename = incrementName(modifiedFilename);
    }
    return modifiedFilename;
}

//# sourceMappingURL=getSafeFilename.js.map