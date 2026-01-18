export function canResizeImage(mimeType) {
    return [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/tiff',
        'image/avif'
    ].indexOf(mimeType) > -1;
}

//# sourceMappingURL=canResizeImage.js.map