export function getIncomingFiles({ data, req }) {
    const file = req.file;
    let files = [];
    if (file && data.filename && data.mimeType) {
        const mainFile = {
            buffer: file.data,
            clientUploadContext: file.clientUploadContext,
            filename: data.filename,
            filesize: file.size,
            mimeType: data.mimeType,
            tempFilePath: file.tempFilePath
        };
        files = [
            mainFile
        ];
        if (data?.sizes) {
            Object.entries(data.sizes).forEach(([key, resizedFileData])=>{
                if (req.payloadUploadSizes?.[key] && resizedFileData.mimeType) {
                    files = files.concat([
                        {
                            buffer: req.payloadUploadSizes[key],
                            filename: `${resizedFileData.filename}`,
                            filesize: req.payloadUploadSizes[key].length,
                            mimeType: resizedFileData.mimeType
                        }
                    ]);
                }
            });
        }
    }
    return files;
}

//# sourceMappingURL=getIncomingFiles.js.map