export async function updateGlobal(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        json: options.data,
        method: 'POST',
        path: `/globals/${options.slug}`
    });
    const { result } = await response.json();
    return result;
}

//# sourceMappingURL=update.js.map