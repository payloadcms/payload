export async function me(sdk, options, init) {
    const response = await sdk.request({
        init,
        method: 'GET',
        path: `/${options.collection}/me`
    });
    return response.json();
}

//# sourceMappingURL=me.js.map