export async function findGlobal(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        method: 'GET',
        path: `/globals/${options.slug}`
    });
    return response.json();
}

//# sourceMappingURL=findOne.js.map