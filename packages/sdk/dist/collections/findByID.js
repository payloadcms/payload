export async function findByID(sdk, options, init) {
    try {
        const response = await sdk.request({
            args: options,
            init,
            method: 'GET',
            path: `/${options.collection}/${options.id}`
        });
        return response.json();
    } catch (err) {
        if (options.disableErrors) {
            // @ts-expect-error generic nullable
            return null;
        }
        throw err;
    }
}

//# sourceMappingURL=findByID.js.map