export async function optionallyAppendMetadata({ req, sharpFile, withMetadata }) {
    const metadata = await sharpFile.metadata();
    if (withMetadata === true) {
        return sharpFile.withMetadata();
    } else if (typeof withMetadata === 'function') {
        const useMetadata = await withMetadata({
            metadata,
            req
        });
        if (useMetadata) {
            return sharpFile.withMetadata();
        }
    }
    return sharpFile;
}

//# sourceMappingURL=optionallyAppendMetadata.js.map