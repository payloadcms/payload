type SanitizedImageData = {
    ext: string;
    name: string;
};
/**
 * Sanitize the image name and extract the extension from the source image
 *
 * @param sourceImage - the source image
 * @returns the sanitized name and extension
 */
export declare const parseFilename: (sourceImage: string) => SanitizedImageData;
export {};
//# sourceMappingURL=parseFilename.d.ts.map