export async function findGlobalVersions(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        method: 'GET',
        path: `/globals/${options.slug}/versions`
    });
    return response.json();
}

//# sourceMappingURL=findVersions.js.map