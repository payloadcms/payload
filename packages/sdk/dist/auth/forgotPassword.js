export async function forgotPassword(sdk, options, init) {
    const response = await sdk.request({
        init,
        json: options.data,
        method: 'POST',
        path: `/${options.collection}/forgot-password`
    });
    return response.json();
}

//# sourceMappingURL=forgotPassword.js.map