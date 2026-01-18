/**
 * Create a new image name based on the output image name, the dimensions and
 * the extension.
 *
 * Ignore the fact that duplicate names could happen if the there is one
 * size with `width AND height` and one with only `height OR width`. Because
 * space is expensive, we will reuse the same image for both sizes.
 *
 * @param outputImageName - the sanitized image name
 * @param bufferInfo - the buffer info
 * @param extension - the extension to use
 * @returns the new image name that is not taken
 */
type CreateImageNameArgs = {
    extension: string;
    height: number;
    outputImageName: string;
    width: number;
};
export declare const generateImageSizeFilename: ({ extension, height, outputImageName, width, }: CreateImageNameArgs) => string;
export {};
//# sourceMappingURL=generateImageSizeFilename.d.ts.map