export async function login(sdk, options, init) {
    const response = await sdk.request({
        init,
        json: options.data,
        method: 'POST',
        path: `/${options.collection}/login`
    });
    return response.json();
}

//# sourceMappingURL=login.js.map