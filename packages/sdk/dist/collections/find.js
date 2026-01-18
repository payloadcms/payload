export async function find(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        method: 'GET',
        path: `/${options.collection}`
    });
    return response.json();
}

//# sourceMappingURL=find.js.map