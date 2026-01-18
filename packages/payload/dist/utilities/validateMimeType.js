export const validateMimeType = (mimeType, allowedMimeTypes)=>{
    if (allowedMimeTypes.length === 0) {
        return true;
    }
    const cleanedMimeTypes = allowedMimeTypes.map((v)=>v.replace('*', ''));
    return cleanedMimeTypes.some((cleanedMimeType)=>mimeType.startsWith(cleanedMimeType));
};

//# sourceMappingURL=validateMimeType.js.map