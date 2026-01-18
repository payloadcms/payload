export async function resetPassword(sdk, options, init) {
    const response = await sdk.request({
        init,
        json: options.data,
        method: 'POST',
        path: `/${options.collection}/reset-password`
    });
    return response.json();
}

//# sourceMappingURL=resetPassword.js.map