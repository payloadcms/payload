export async function refreshToken(sdk, options, init) {
    const response = await sdk.request({
        init,
        method: 'POST',
        path: `/${options.collection}/refresh-token`
    });
    return response.json();
}

//# sourceMappingURL=refreshToken.js.map