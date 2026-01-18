/**
 * Create the result object for the image resize operation based on the
 * provided parameters. If the name is not provided, an empty result object
 * is returned.
 *
 * @param filename - the filename of the image
 * @param width - the width of the image
 * @param height - the height of the image
 * @param filesize - the filesize of the image
 * @param mimeType - the mime type of the image
 * @returns a FileSize result object
 */ export const createImageSize = ({ filename = null, filesize = null, height = null, mimeType = null, url = null, width = null })=>{
    return {
        filename,
        filesize,
        height,
        mimeType,
        url,
        width
    };
};

//# sourceMappingURL=createImageSize.js.map