export async function verifyEmail(sdk, options, init) {
    const response = await sdk.request({
        init,
        method: 'POST',
        path: `/${options.collection}/verify/${options.token}`
    });
    return response.json();
}

//# sourceMappingURL=verifyEmail.js.map