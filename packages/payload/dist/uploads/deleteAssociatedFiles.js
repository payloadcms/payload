import fs from 'fs/promises';
import { ErrorDeletingFile } from '../errors/index.js';
import { fileExists } from './fileExists.js';
export const deleteAssociatedFiles = async ({ collectionConfig, doc, files = [], overrideDelete, req })=>{
    if (!collectionConfig.upload) {
        return;
    }
    if (overrideDelete || files.length > 0) {
        const { staticDir: staticPath } = collectionConfig.upload;
        const fileToDelete = `${staticPath}/${doc.filename}`;
        try {
            if (await fileExists(fileToDelete)) {
                await fs.unlink(fileToDelete);
            }
        } catch (ignore) {
            throw new ErrorDeletingFile(req.t);
        }
        if (doc.sizes) {
            const sizes = Object.values(doc.sizes);
            // Since forEach will not wait until unlink is finished it could
            // happen that two operations will try to delete the same file.
            // To avoid this it is recommended to use "sync" instead
            for (const size of sizes){
                const sizeToDelete = `${staticPath}/${size.filename}`;
                try {
                    if (await fileExists(sizeToDelete)) {
                        await fs.unlink(sizeToDelete);
                    }
                } catch (ignore) {
                    throw new ErrorDeletingFile(req.t);
                }
            }
        }
    }
};

//# sourceMappingURL=deleteAssociatedFiles.js.map