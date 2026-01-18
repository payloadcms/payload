/**
 * Used to extract height from images, animated or not.
 *
 * @param sharpMetadata - the sharp metadata
 * @returns the height of the image
 */ export function extractHeightFromImage(sharpMetadata) {
    if (sharpMetadata?.pages) {
        return sharpMetadata.height / sharpMetadata.pages;
    }
    return sharpMetadata.height;
}

//# sourceMappingURL=extractHeightFromImage.js.map