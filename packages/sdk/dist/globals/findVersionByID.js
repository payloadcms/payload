export async function findGlobalVersionByID(sdk, options, init) {
    try {
        const response = await sdk.request({
            args: options,
            init,
            method: 'GET',
            path: `/globals/${options.slug}/versions/${options.id}`
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

//# sourceMappingURL=findVersionByID.js.map