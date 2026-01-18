export async function findVersions(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        method: 'GET',
        path: `/${options.collection}/versions`
    });
    return response.json();
}

//# sourceMappingURL=findVersions.js.map