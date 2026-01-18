export async function count(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        method: 'GET',
        path: `/${options.collection}/count`
    });
    return response.json();
}

//# sourceMappingURL=count.js.map